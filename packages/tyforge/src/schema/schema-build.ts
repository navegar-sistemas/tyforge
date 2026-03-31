import { ISchema, InferJson, InferProps } from "./schema-types";
import type {
  IBatchCreateResult,
  IBatchCreateOptions,
  IBatchCreateError,
} from "./schema-types";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { Result } from "@tyforge/result";
import type { TAssignFn } from "./schema-types";
import type { Runner } from "./schema-internal-types";
import { SchemaCompiler } from "./schema-compiler";
import { SchemaRunner } from "./schema-runner";

export type {
  IBatchCreateError,
  IBatchCreateOptions,
  IBatchCreateResult,
} from "./schema-types";

export interface ICompiledSchema<TSchema extends ISchema> {
  create<T = InferJson<TSchema>>(
    data: T,
    path?: string,
  ): Result<InferProps<TSchema>, Exceptions>;
  assign<T = InferJson<TSchema>>(
    data: T,
    path?: string,
  ): Result<InferProps<TSchema>, Exceptions>;
  batchCreate(
    items: unknown[],
    options?: IBatchCreateOptions,
  ): IBatchCreateResult<TSchema> | Promise<IBatchCreateResult<TSchema>>;
}

export class SchemaBuilder {
  private static _maxDepth = 50;

  static get maxDepth(): number {
    return SchemaBuilder._maxDepth;
  }

  static set maxDepth(value: number) {
    if (value < 1 || !Number.isInteger(value)) {
      throw new Error("SchemaBuilder.maxDepth must be a positive integer");
    }
    SchemaBuilder._maxDepth = value;
  }

  static compile<TSchema extends ISchema>(
    schema: TSchema,
  ): ICompiledSchema<TSchema> {
    const compiler = new SchemaCompiler(SchemaBuilder._maxDepth);
    const schemaRunner = new SchemaRunner();
    const runner = schemaRunner.createExecuteFn(schema, compiler);

    return {
      create<T = InferJson<TSchema>>(
        data: T,
        path = "",
      ): Result<InferProps<TSchema>, Exceptions> {
        const result = runner(data, path, "create");
        SchemaBuilder.assertResultType<InferProps<TSchema>>(result);
        return result;
      },
      assign<T = InferJson<TSchema>>(
        data: T,
        path = "",
      ): Result<InferProps<TSchema>, Exceptions> {
        const result = runner(data, path, "assign");
        SchemaBuilder.assertResultType<InferProps<TSchema>>(result);
        return result;
      },
      // Dynamic import prevents Metro/bundlers from
      // resolving node:worker_threads.
      // In browser/React Native, import() fails or
      // returns null — falls back to sequential.
      batchCreate(
        items: unknown[],
        options?: IBatchCreateOptions,
      ): IBatchCreateResult<TSchema> | Promise<IBatchCreateResult<TSchema>> {
        if (items.length > 1000000) {
          throw new Error("Batch size exceeds maximum of 1000000 items");
        }

        const concurrency = Math.max(1, Math.floor(options?.concurrency ?? 1));
        const chunkSize = Math.max(
          1,
          Math.min(Math.floor(options?.chunkSize ?? 10000), 100000),
        );

        if (concurrency > 1) {
          const assignFn: TAssignFn<TSchema> = (data) => {
            const r = runner(data, "", "assign");
            SchemaBuilder.assertResultType<InferProps<TSchema>>(r);
            return r;
          };
          const sequential = (): IBatchCreateResult<TSchema> =>
            SchemaBuilder.runSequential<TSchema>(items, runner);
          return import("./batch-parallel")
            .then(({ createParallelProcessor }) => {
              const processor = createParallelProcessor();
              if (processor) {
                return processor.process(
                  schema,
                  items,
                  {
                    concurrency,
                    chunkSize,
                    workerTimeout: options?.workerTimeout,
                  },
                  assignFn,
                );
              }
              return sequential();
            })
            .catch(() => sequential());
        }

        return SchemaBuilder.runSequential(items, runner);
      },
    };
  }

  private static assertResultType<T>(
    result: Result<unknown, Exceptions>,
  ): asserts result is Result<T, Exceptions> {
    if (!("success" in result)) {
      throw new TypeError("Expected a Result object");
    }
  }

  private static runSequential<TSchema extends ISchema>(
    items: unknown[],
    runner: Runner,
  ): IBatchCreateResult<TSchema> {
    const successes: InferProps<TSchema>[] = [];
    const failures: IBatchCreateError[] = [];
    for (let i = 0; i < items.length; i++) {
      const result = runner(items[i], "", "create");
      SchemaBuilder.assertResultType<InferProps<TSchema>>(result);
      if (result.success) {
        successes.push(result.value);
      } else {
        failures.push({ index: i, error: result.error });
      }
    }
    return { ok: successes, errors: failures };
  }
}
