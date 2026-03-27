import { Worker } from "node:worker_threads";
import * as path from "node:path";
import * as os from "node:os";
import type { ISchema, InferProps, IParallelProcessor, IBatchCreateResult, IBatchCreateError, TAssignUnknown } from "./schema-types";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { isFailure } from "@tyforge/result/result";
import { TypeGuard } from "@tyforge/tools/type_guard";

// Worker threads require an absolute file path (Node.js API limitation).
// The extension is derived from the current file to match dev (.ts) vs prod (.js).
const WORKER_EXT = path.extname(__filename);
const WORKER_PATH = path.resolve(__dirname, `batch-worker${WORKER_EXT}`);
const IS_TYPESCRIPT = WORKER_EXT === ".ts";
const WORKER_TIMEOUT_MS = 30000;

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

export function createParallelProcessor(): IParallelProcessor | null {
  return new ParallelBatchProcessor();
}

class ParallelBatchProcessor implements IParallelProcessor {
  private createWorker(): Worker {
    if (IS_TYPESCRIPT) {
      return new Worker(WORKER_PATH, { execArgv: ["--require", "tsx/cjs"] });
    }
    return new Worker(WORKER_PATH);
  }

  async process<TSchema extends ISchema>(
    schema: TSchema,
    items: unknown[],
    options: { concurrency: number; chunkSize: number },
    assignUnknown: TAssignUnknown<TSchema>,
  ): Promise<IBatchCreateResult<TSchema>> {
    const serializedSchema = this.serializeSchema(schema);
    const chunks = this.splitChunks(items, options.chunkSize);
    const maxConcurrency = Math.min(options.concurrency, os.cpus().length, 16);
    const workerCount = Math.min(maxConcurrency, chunks.length);

    const workerResults = await this.runWorkers(serializedSchema, chunks, workerCount);

    return this.reconstructResults<TSchema>(workerResults, assignUnknown);
  }

  private serializeSchema(schema: Record<string, unknown>): Record<string, unknown> {
    const serialized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(schema)) {
      if (TypeGuard.isRecord(value) && "type" in value) {
        const typeClass = value["type"];
        if (TypeGuard.isCallable(typeClass)) {
          serialized[key] = { ...value, type: typeClass.name };
        }
      } else if (Array.isArray(value) && value.length === 1) {
        const entry = value[0];
        if (TypeGuard.isRecord(entry) && "type" in entry) {
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
    const chunks: { items: unknown[]; startIndex: number }[] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push({
        items: items.slice(i, i + chunkSize),
        startIndex: i,
      });
    }
    return chunks;
  }

  private async runWorkers(
    serializedSchema: Record<string, unknown>,
    chunks: { items: unknown[]; startIndex: number }[],
    workerCount: number,
  ): Promise<IWorkerResult[]> {
    const results: IWorkerResult[] = [];
    const pendingChunks = [...chunks];
    const activeWorkers: Worker[] = [];

    const processChunk = async (): Promise<void> => {
      while (pendingChunks.length > 0) {
        const chunk = pendingChunks.shift();
        if (!chunk) break;

        const worker = this.createWorker();
        activeWorkers.push(worker);

        try {
          const workerDone = new Promise<IWorkerResult>((resolve, reject) => {
            worker.on("message", resolve);
            worker.on("error", reject);
            worker.postMessage({
              schema: serializedSchema,
              items: chunk.items,
              startIndex: chunk.startIndex,
            });
          });
          const timer = setTimeout(() => { worker.terminate(); }, WORKER_TIMEOUT_MS);
          const result = await workerDone;
          clearTimeout(timer);
          results.push(result);
        } finally {
          worker.terminate();
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
      for (const w of activeWorkers) w.terminate();
      throw err;
    }

    return results;
  }

  private reconstructResults<TSchema extends ISchema>(
    workerResults: IWorkerResult[],
    assignUnknown: TAssignUnknown<TSchema>,
  ): IBatchCreateResult<TSchema> {
    const allSuccesses: { index: number; value: InferProps<TSchema> }[] = [];
    const allFailures: IBatchCreateError[] = [];

    for (const result of workerResults) {
      for (const success of result.successes) {
        if (!TypeGuard.isRecord(success.value)) {
          allFailures.push({ index: success.index, error: ExceptionValidation.create("root", "Expected object from worker") });
          continue;
        }
        const assigned = assignUnknown(success.value);
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
