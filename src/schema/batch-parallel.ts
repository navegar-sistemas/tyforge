import { Worker } from "node:worker_threads";
import * as path from "node:path";
import * as os from "node:os";
import type { ISchema, InferProps } from "./schema-types";
import type { IBatchCreateError } from "./schema-build";
import { SchemaBuilder } from "./schema-build";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { isFailure } from "@tyforge/result/result";
import { TypeGuard } from "@tyforge/tools/type_guard";

export interface IBatchCreateOptions {
  concurrency?: number;
  chunkSize?: number;
}

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

export class ParallelBatchProcessor {
  private readonly workerPath: string;
  private readonly isDevMode: boolean;

  constructor() {
    const tsPath = path.resolve(__dirname, "batch-worker.ts");
    const jsPath = path.resolve(__dirname, "batch-worker.js");

    this.isDevMode = __filename.endsWith(".ts");
    this.workerPath = this.isDevMode ? tsPath : jsPath;
  }

  private createWorker(): Worker {
    if (this.isDevMode) {
      return new Worker(this.workerPath, {
        execArgv: ["--require", "tsx/cjs"],
      });
    }
    return new Worker(this.workerPath);
  }

  async process<TSchema extends ISchema>(
    schema: TSchema,
    items: unknown[],
    options: Required<IBatchCreateOptions>,
  ): Promise<{ ok: InferProps<TSchema>[]; errors: IBatchCreateError[] }> {
    const serializedSchema = this.serializeSchema(schema);
    const chunks = this.splitChunks(items, options.chunkSize);
    const maxConcurrency = Math.min(options.concurrency, os.cpus().length, 16);
    const workerCount = Math.min(maxConcurrency, chunks.length);

    const workerResults = await this.runWorkers(serializedSchema, chunks, workerCount);

    return this.reconstructResults<TSchema>(schema, workerResults);
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
          const result = await new Promise<IWorkerResult>((resolve, reject) => {
            worker.on("message", resolve);
            worker.on("error", reject);
            worker.postMessage({
              schema: serializedSchema,
              items: chunk.items,
              startIndex: chunk.startIndex,
            });
          });
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
    schema: TSchema,
    workerResults: IWorkerResult[],
  ): { ok: InferProps<TSchema>[]; errors: IBatchCreateError[] } {
    const validator = SchemaBuilder.compile(schema);
    const allSuccesses: { index: number; value: InferProps<TSchema> }[] = [];
    const allFailures: IBatchCreateError[] = [];

    for (const result of workerResults) {
      for (const success of result.successes) {
        if (!TypeGuard.isRecord(success.value)) {
          allFailures.push({ index: success.index, error: ExceptionValidation.create("root", "Expected object from worker") });
          continue;
        }
        const assigned = validator.assignUnknown(success.value);
        if (isFailure(assigned)) {
          allFailures.push({ index: success.index, error: assigned.error });
        } else {
          allSuccesses.push({ index: success.index, value: assigned.value });
        }
      }

      for (const failure of result.failures) {
        const detail = TypeGuard.isString(failure.error["detail"], "detail").success
          ? String(failure.error["detail"])
          : "Validation failed";
        const field = TypeGuard.isString(failure.error["field"], "field").success
          ? String(failure.error["field"])
          : "unknown";
        allFailures.push({
          index: failure.index,
          error: ExceptionValidation.create(field, detail),
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
