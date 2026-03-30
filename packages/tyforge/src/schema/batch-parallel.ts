// Node.js-only imports (worker_threads, path, os) are loaded lazily inside
// process() to avoid crashing bundlers like Metro (React Native) that resolve
// all top-level require() calls at build time — even for unused code paths.

import type { ISchema, InferProps, IParallelProcessor, IBatchCreateResult, IBatchCreateError, TAssignFn } from "./schema-types";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { isFailure } from "@tyforge/result/result";
import { TypeGuard } from "@tyforge/tools/type_guard";

interface IWorkerSuccess {
  index: number;
  value: unknown;
}

interface IWorkerFailure {
  index: number;
  error: Record<string, unknown>;
}

interface IWorkerResult {
  successes: IWorkerSuccess[];
  failures: IWorkerFailure[];
}

interface IWorkerHandle {
  on(event: "message", listener: (value: IWorkerResult) => void): void;
  on(event: "error", listener: (err: Error) => void): void;
  removeAllListeners(): void;
  postMessage(value: unknown): void;
  terminate(): Promise<number>;
}

type TWorkerFactory = () => IWorkerHandle;

export function createParallelProcessor(): IParallelProcessor | null {
  return new ParallelBatchProcessor();
}

class ParallelBatchProcessor implements IParallelProcessor {
  async process<TSchema extends ISchema>(
    schema: TSchema,
    items: unknown[],
    options: { concurrency: number; chunkSize: number; workerTimeout?: number },
    assignFn: TAssignFn<TSchema>,
  ): Promise<IBatchCreateResult<TSchema>> {
    const { Worker } = await import("node:worker_threads");
    const nodePath = await import("node:path");
    const nodeOs = await import("node:os");
    const { fileURLToPath } = await import("node:url");

    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = nodePath.dirname(currentFile);
    const ext = nodePath.extname(currentFile);
    const isTs = ext === ".ts";

    // In dev (.ts), tsx ESM loader does not fully support worker threads.
    // Use compiled dist/ which has .js extensions and runs as native ESM.
    let resolvedWorkerPath: string;
    if (isTs) {
      const distWorkerPath = nodePath.resolve(currentDir, "..", "..", "dist", "schema", "batch-worker.js");
      const nodeFs = await import("node:fs");
      try {
        nodeFs.accessSync(distWorkerPath);
        resolvedWorkerPath = distWorkerPath;
      } catch {
        resolvedWorkerPath = nodePath.resolve(currentDir, `batch-worker${ext}`);
      }
    } else {
      resolvedWorkerPath = nodePath.resolve(currentDir, `batch-worker${ext}`);
    }

    const createWorker: TWorkerFactory = () => {
      return new Worker(resolvedWorkerPath);
    };

    const serializedSchema = this.serializeSchema(schema);
    const chunks = this.splitChunks(items, options.chunkSize);
    const maxConcurrency = Math.min(options.concurrency, nodeOs.cpus().length, 16);
    const workerCount = Math.min(maxConcurrency, chunks.length);
    const timeout = Math.max(1000, Math.min(options.workerTimeout ?? 30000, 300000));

    const workerResults = await this.runWorkers(serializedSchema, chunks, workerCount, createWorker, timeout);

    return this.reconstructResults<TSchema>(workerResults, assignFn);
  }

  private serializeSchema(schema: Record<string, unknown>): Record<string, unknown> {
    const serialized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(schema)) {
      if (TypeGuard.isRecord(value) && Object.prototype.hasOwnProperty.call(value, "type")) {
        const typeClass = value["type"];
        if (TypeGuard.isCallable(typeClass)) {
          serialized[key] = { ...value, type: typeClass.name };
        }
      } else if (Array.isArray(value) && value.length === 1) {
        const entry = value[0];
        if (TypeGuard.isRecord(entry) && Object.prototype.hasOwnProperty.call(entry, "type")) {
          const typeClass = entry["type"];
          if (TypeGuard.isCallable(typeClass)) {
            serialized[key] = [{ ...entry, type: typeClass.name }];
          }
        }
      } else if (TypeGuard.isRecord(value)) {
        serialized[key] = this.serializeSchema(value);
      }
    }

    return serialized;
  }

  private splitChunks(items: unknown[], chunkSize: number): { items: unknown[]; startIndex: number }[] {
    const safeChunkSize = Math.max(1, Math.min(chunkSize, items.length || 1));
    const chunks: { items: unknown[]; startIndex: number }[] = [];
    for (let i = 0; i < items.length; i += safeChunkSize) {
      chunks.push({
        items: items.slice(i, i + safeChunkSize),
        startIndex: i,
      });
    }
    return chunks;
  }

  private async runWorkers(
    serializedSchema: Record<string, unknown>,
    chunks: { items: unknown[]; startIndex: number }[],
    workerCount: number,
    createWorker: TWorkerFactory,
    workerTimeout: number,
  ): Promise<IWorkerResult[]> {
    const resultMap = new Map<number, IWorkerResult>();
    let chunkIndex = 0;
    const pendingChunks = [...chunks];
    const activeWorkers: IWorkerHandle[] = [];

    const processChunk = async (): Promise<void> => {
      while (pendingChunks.length > 0) {
        const localIndex = chunkIndex++;
        const chunk = pendingChunks.shift();
        if (!chunk) break;

        const worker = createWorker();
        activeWorkers.push(worker);

        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
          const workerDone = new Promise<IWorkerResult>((resolve, reject) => {
            worker.on("message", resolve);
            worker.on("error", reject);
            worker.postMessage({
              schema: serializedSchema,
              items: chunk.items,
              startIndex: chunk.startIndex,
            });
            timer = setTimeout(() => {
              worker.removeAllListeners();
              worker.terminate();
              reject(new Error("Worker timed out after " + workerTimeout + "ms"));
            }, workerTimeout);
          });
          const result = await workerDone;
          resultMap.set(localIndex, result);
        } finally {
          clearTimeout(timer);
          worker.removeAllListeners();
          await worker.terminate();
          const idx = activeWorkers.indexOf(worker);
          if (idx !== -1) activeWorkers.splice(idx, 1);
        }
      }
    };

    const workerPromises: Promise<void>[] = [];
    for (let i = 0; i < workerCount; i++) {
      workerPromises.push(processChunk());
    }

    try {
      await Promise.all(workerPromises);
    } catch (err) {
      await Promise.all(activeWorkers.map(w => w.terminate()));
      throw err;
    }

    return Array.from({ length: resultMap.size }, (_, i) => {
      const r = resultMap.get(i);
      if (!r) throw new Error("Missing worker result for chunk " + i);
      return r;
    });
  }

  private reconstructResults<TSchema extends ISchema>(
    workerResults: IWorkerResult[],
    assignFn: TAssignFn<TSchema>,
  ): IBatchCreateResult<TSchema> {
    const allSuccesses: { index: number; value: InferProps<TSchema> }[] = [];
    const allFailures: IBatchCreateError[] = [];

    for (const result of workerResults) {
      for (const success of result.successes) {
        if (!TypeGuard.isRecord(success.value)) {
          allFailures.push({ index: success.index, error: ExceptionValidation.create("root", "Expected object from worker") });
          continue;
        }
        const assigned = assignFn(success.value);
        if (isFailure(assigned)) {
          allFailures.push({ index: success.index, error: assigned.error });
        } else {
          allSuccesses.push({ index: success.index, value: assigned.value });
        }
      }

      for (const failure of result.failures) {
        const detailResult = TypeGuard.isString(failure.error["detail"], "detail");
        const fieldResult = TypeGuard.isString(failure.error["field"], "field");
        allFailures.push({
          index: failure.index,
          error: ExceptionValidation.create(
            fieldResult.success ? fieldResult.value : "unknown",
            detailResult.success ? detailResult.value : "Validation failed",
          ),
        });
      }
    }

    allSuccesses.sort((a, b) => a.index - b.index);
    allFailures.sort((a, b) => a.index - b.index);

    return {
      ok: allSuccesses.map(s => s.value),
      errors: allFailures,
    };
  }
}
