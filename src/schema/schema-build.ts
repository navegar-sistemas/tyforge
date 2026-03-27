import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { ISchema, InferJson, InferProps } from "./schema-types";
import type { TValidationLevel, IBatchCreateResult, IBatchCreateOptions, IBatchCreateError } from "./schema-types";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { err, ok, Result } from "@tyforge/result";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { TypeField } from "@tyforge/type-fields/type-field.base";
import type { TAssignUnknown } from "./schema-types";

// ── Type Guards (zero casts) ────────────────────────────────────

type Creatable = {
  create(value: unknown, fieldPath?: string): Result<unknown, Exceptions>;
  assign?(value: unknown, fieldPath?: string): Result<unknown, Exceptions>;
};

function hasType(entry: unknown): entry is { type: unknown; required?: boolean; isArray?: boolean } {
  return !!entry && typeof entry === "object" && "type" in entry;
}

function isCreatable(t: unknown): t is Creatable {
  return !!t && (typeof t === "object" || typeof t === "function") && "create" in t && typeof t.create === "function";
}

function hasAssign(t: Creatable): boolean {
  return typeof t.assign === "function";
}

function assertResultType<T>(result: Result<unknown, Exceptions>): asserts result is Result<T, Exceptions> {
  if (!("success" in result)) {
    throw new TypeError("Expected a Result object");
  }
}

function assertRecord(data: unknown): asserts data is Record<string, unknown> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new TypeError("Expected a plain object");
  }
}

// ── Compiled Schema ─────────────────────────────────────────────

const requiredError = (path: string) =>
  ExceptionValidation.create(path, "Required field missing.");

const enum EFieldKind {
  Creatable,
  NestedSchema,
  ArrayCreatable,
  ArrayNestedSchema,
}

interface ICompiledField {
  key: string;
  path: string;
  required: boolean;
  kind: EFieldKind;
  creatable: Creatable | null;
  hasAssign: boolean;
  nestedValidator: ICompiledValidator | null;
  assignValidateLevel: TValidationLevel;
  createValidateLevel: TValidationLevel;
}

interface ICompiledValidator {
  fields: ICompiledField[];
  run(data: unknown, basePath: string, mode: "create" | "assign"): Result<Record<string, unknown>, Exceptions>;
}

function extractValidateLevels(entry: unknown): { assignValidateLevel: TValidationLevel; createValidateLevel: TValidationLevel } {
  const defaults = { assignValidateLevel: TypeField.assignLevel, createValidateLevel: TypeField.createLevel };
  if (!TypeGuard.isRecord(entry)) return defaults;
  const v = entry["validate"];
  if (!TypeGuard.isRecord(v)) return defaults;
  const assign = v["assign"];
  const create = v["create"];
  return {
    assignValidateLevel: (assign === "full" || assign === "type" || assign === "none") ? assign : TypeField.assignLevel,
    createValidateLevel: (create === "full" || create === "type" || create === "none") ? create : TypeField.createLevel,
  };
}

function compileFields(schema: Record<string, unknown>, basePath: string): ICompiledField[] {
  const fields: ICompiledField[] = [];

  for (const key of Object.keys(schema)) {
    let entry: unknown = schema[key];
    const path = basePath ? `${basePath}.${key}` : key;

    // Array syntax [{ type, required }]
    if (Array.isArray(entry) && entry.length > 0 && hasType(entry[0])) {
      const cfg = entry[0];
      // Validate cfg is a proper object before accessing its properties
      if (typeof cfg !== "object" || cfg === null) continue;
      entry = { type: cfg.type, required: cfg.required, isArray: true };
    }

    if (hasType(entry)) {
      const t = entry.type;
      const isArray = entry.isArray === true;
      const { assignValidateLevel, createValidateLevel } = extractValidateLevels(entry);

      if (isCreatable(t)) {
        fields.push({
          key, path,
          required: entry.required !== false,
          kind: isArray ? EFieldKind.ArrayCreatable : EFieldKind.Creatable,
          creatable: t,
          hasAssign: hasAssign(t),
          nestedValidator: null,
          assignValidateLevel,
          createValidateLevel,
        });
      } else if (!!t && typeof t === "object") {
        assertRecord(t);
        fields.push({
          key, path,
          required: entry.required !== false,
          kind: isArray ? EFieldKind.ArrayNestedSchema : EFieldKind.NestedSchema,
          creatable: null,
          hasAssign: false,
          nestedValidator: { fields: compileFields(t, path), run: createRunner(t) },
          assignValidateLevel,
          createValidateLevel,
        });
      }
    } else if (!!entry && typeof entry === "object" && !Array.isArray(entry)) {
      assertRecord(entry);
      fields.push({
        key, path,
        required: true,
        kind: EFieldKind.NestedSchema,
        creatable: null,
        hasAssign: false,
        nestedValidator: { fields: compileFields(entry, path), run: createRunner(entry) },
        assignValidateLevel: "type",
        createValidateLevel: "full",
      });
    }
  }

  return fields;
}

function createRunner(schema: Record<string, unknown>) {
  let compiled: ICompiledField[] | null = null;

  return function run(data: unknown, basePath: string, mode: "create" | "assign"): Result<Record<string, unknown>, Exceptions> {
    if (!compiled) compiled = compileFields(schema, basePath);

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return err(ExceptionValidation.create(basePath || "root", "Required data missing."));
    }
    assertRecord(data);

    const props: Record<string, unknown> = {};
    const useAssign = mode === "assign";

    for (let i = 0; i < compiled.length; i++) {
      const field = compiled[i];
      const { key, path: fieldPath, required, kind, creatable, nestedValidator } = field;
      const value = data[key];

      switch (kind) {
        case EFieldKind.Creatable: {
          if (value === undefined || value === null) {
            if (required) return err(requiredError(fieldPath));
            continue;
          }
          if (!creatable) continue;
          const useCreateMethod = useAssign
            ? field.assignValidateLevel === "full"
            : field.createValidateLevel === "full";
          const res = !useCreateMethod && field.hasAssign && creatable.assign
            ? creatable.assign(value, fieldPath)
            : creatable.create(value, fieldPath);
          if (!res.success) return res;
          props[key] = res.value;
          break;
        }

        case EFieldKind.ArrayCreatable: {
          if (value === undefined || value === null) {
            if (required) return err(requiredError(fieldPath));
            continue;
          }
          if (!Array.isArray(value)) {
            return err(ExceptionValidation.create(fieldPath, "Expected array."));
          }
          if (!creatable) continue;
          const arr: unknown[] = [];
          const useCreateMethodArr = useAssign
            ? field.assignValidateLevel === "full"
            : field.createValidateLevel === "full";
          for (let j = 0; j < value.length; j++) {
            const item = value[j];
            if (required && (item === undefined || item === null)) {
              return err(requiredError(`${fieldPath}[${j}]`));
            }
            const res = !useCreateMethodArr && field.hasAssign && creatable.assign
              ? creatable.assign(item, `${fieldPath}[${j}]`)
              : creatable.create(item, `${fieldPath}[${j}]`);
            if (!res.success) return res;
            arr.push(res.value);
          }
          props[key] = arr;
          break;
        }

        case EFieldKind.NestedSchema: {
          if (value === undefined || value === null) {
            if (required) return err(requiredError(fieldPath));
            continue;
          }
          if (!nestedValidator) continue;
          const nested = nestedValidator.run(value, fieldPath, mode);
          if (!nested.success) return nested;
          props[key] = nested.value;
          break;
        }

        case EFieldKind.ArrayNestedSchema: {
          if (value === undefined || value === null) {
            if (required) return err(requiredError(fieldPath));
            continue;
          }
          if (!Array.isArray(value)) {
            return err(ExceptionValidation.create(fieldPath, "Expected array."));
          }
          if (!nestedValidator) continue;
          const arr: unknown[] = [];
          for (let j = 0; j < value.length; j++) {
            const item = value[j];
            if (required && (item === undefined || item === null)) {
              return err(requiredError(`${fieldPath}[${j}]`));
            }
            const nested = nestedValidator.run(item, `${fieldPath}[${j}]`, mode);
            if (!nested.success) return nested;
            arr.push(nested.value);
          }
          props[key] = arr;
          break;
        }
      }
    }

    return ok(props);
  };
}

// ── Sequential Batch ─────────────────────────────────────────────

type Runner = (data: unknown, basePath: string, mode: "create" | "assign") => Result<Record<string, unknown>, Exceptions>;

function runSequential<TSchema extends ISchema>(
  items: unknown[],
  runner: Runner,
): IBatchCreateResult<TSchema> {
  const successes: InferProps<TSchema>[] = [];
  const failures: IBatchCreateError[] = [];
  for (let i = 0; i < items.length; i++) {
    const result = runner(items[i], "", "create");
    assertResultType<InferProps<TSchema>>(result);
    if (result.success) {
      successes.push(result.value);
    } else {
      failures.push({ index: i, error: result.error });
    }
  }
  return { ok: successes, errors: failures };
}

// ── Public API ───────────────────────────────────────────────────

export type { IBatchCreateError, IBatchCreateOptions, IBatchCreateResult } from "./schema-types";

export interface ICompiledSchema<TSchema extends ISchema> {
  create(data: InferJson<TSchema>, path?: string): Result<InferProps<TSchema>, Exceptions>;
  createUnknown(data: unknown, path?: string): Result<InferProps<TSchema>, Exceptions>;
  assign(data: InferJson<TSchema>, path?: string): Result<InferProps<TSchema>, Exceptions>;
  assignUnknown(data: unknown, path?: string): Result<InferProps<TSchema>, Exceptions>;
  batchCreate(items: unknown[], options?: IBatchCreateOptions): IBatchCreateResult<TSchema> | Promise<IBatchCreateResult<TSchema>>;
}

export class SchemaBuilder {
  static compile<TSchema extends ISchema>(
    schema: TSchema,
  ): ICompiledSchema<TSchema> {
    const runner = createRunner(schema);

    return {
      create(data: InferJson<TSchema>, path = ""): Result<InferProps<TSchema>, Exceptions> {
        const result = runner(data, path, "create");
        assertResultType<InferProps<TSchema>>(result);
        return result;
      },
      createUnknown(data: unknown, path = ""): Result<InferProps<TSchema>, Exceptions> {
        const result = runner(data, path, "create");
        assertResultType<InferProps<TSchema>>(result);
        return result;
      },
      assign(data: InferJson<TSchema>, path = ""): Result<InferProps<TSchema>, Exceptions> {
        const result = runner(data, path, "assign");
        assertResultType<InferProps<TSchema>>(result);
        return result;
      },
      assignUnknown(data: unknown, path = ""): Result<InferProps<TSchema>, Exceptions> {
        const result = runner(data, path, "assign");
        assertResultType<InferProps<TSchema>>(result);
        return result;
      },
      batchCreate(items: unknown[], options?: IBatchCreateOptions): IBatchCreateResult<TSchema> | Promise<IBatchCreateResult<TSchema>> {
        const concurrency = options?.concurrency ?? 1;

        // Parallel mode — dynamic import prevents Metro/bundlers from resolving node:worker_threads.
        // In browser/React Native, import() fails or returns null processor — falls back to sequential.
        if (concurrency > 1) {
          const assignFn: TAssignUnknown<TSchema> = (data) => {
            const r = runner(data, "", "assign");
            assertResultType<InferProps<TSchema>>(r);
            return r;
          };
          const sequential = (): IBatchCreateResult<TSchema> => runSequential<TSchema>(items, runner);
          return import("./batch-parallel")
            .then(({ createParallelProcessor }) => {
              const processor = createParallelProcessor();
              if (processor) {
                return processor.process(schema, items, {
                  concurrency,
                  chunkSize: options?.chunkSize ?? 10000,
                }, assignFn);
              }
              return sequential();
            })
            .catch(() => sequential());
        }

        return runSequential(items, runner);
      },
    };
  }

}
