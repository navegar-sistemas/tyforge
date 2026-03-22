import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import {
  ISchema,
  InferJson,
  InferProps,
} from "./schema-types";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { err, ok, Result } from "@tyforge/result";

// ── Type Guards (zero casts) ────────────────────────────────────

type Creatable = {
  create(value: unknown, fieldPath?: string): Result<unknown, Exceptions>;
  assign?(value: unknown): Result<unknown, Exceptions>;
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
  void result;
}

function assertRecord(data: unknown): asserts data is Record<string, unknown> {
  void data;
}

// ── Compiled Schema ─────────────────────────────────────────────

const requiredError = (path: string) =>
  ExceptionValidation.create(path, "Campo obrigatório ausente.");

const enum FieldKind {
  Creatable,
  NestedSchema,
  ArrayCreatable,
  ArrayNestedSchema,
}

interface CompiledField {
  key: string;
  path: string;
  required: boolean;
  kind: FieldKind;
  creatable: Creatable | null;
  hasAssign: boolean;
  nestedValidator: CompiledValidator | null;
}

interface CompiledValidator {
  fields: CompiledField[];
  run(data: unknown, basePath: string, mode: "create" | "assign"): Result<Record<string, unknown>, Exceptions>;
}

function compileFields(schema: Record<string, unknown>, basePath: string): CompiledField[] {
  const fields: CompiledField[] = [];

  for (const key of Object.keys(schema)) {
    let entry: unknown = schema[key];
    const path = basePath ? `${basePath}.${key}` : key;

    // Array syntax [{ type, required }]
    if (Array.isArray(entry) && entry.length > 0 && hasType(entry[0])) {
      const cfg = entry[0];
      entry = { type: cfg.type, required: cfg.required, isArray: true };
    }

    if (hasType(entry)) {
      const t = entry.type;
      const isArray = entry.isArray === true;

      if (isCreatable(t)) {
        fields.push({
          key, path,
          required: entry.required !== false,
          kind: isArray ? FieldKind.ArrayCreatable : FieldKind.Creatable,
          creatable: t,
          hasAssign: hasAssign(t),
          nestedValidator: null,
        });
      } else if (!!t && typeof t === "object") {
        assertRecord(t);
        fields.push({
          key, path,
          required: entry.required !== false,
          kind: isArray ? FieldKind.ArrayNestedSchema : FieldKind.NestedSchema,
          creatable: null,
          hasAssign: false,
          nestedValidator: { fields: compileFields(t, isArray ? "" : path), run: createRunner(t) },
        });
      }
    } else if (!!entry && typeof entry === "object" && !Array.isArray(entry)) {
      assertRecord(entry);
      fields.push({
        key, path,
        required: true,
        kind: FieldKind.NestedSchema,
        creatable: null,
        hasAssign: false,
        nestedValidator: { fields: compileFields(entry, path), run: createRunner(entry) },
      });
    }
  }

  return fields;
}

function createRunner(schema: Record<string, unknown>) {
  let compiled: CompiledField[] | null = null;

  return function run(data: unknown, basePath: string, mode: "create" | "assign"): Result<Record<string, unknown>, Exceptions> {
    if (!compiled) compiled = compileFields(schema, basePath);

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return err(ExceptionValidation.create(basePath || "root", "Dados obrigatórios ausentes."));
    }
    assertRecord(data);

    const props: Record<string, unknown> = {};
    const useAssign = mode === "assign";

    for (let i = 0; i < compiled.length; i++) {
      const { key, path: fieldPath, required, kind, creatable, nestedValidator } = compiled[i];
      const value = data[key];

      switch (kind) {
        case FieldKind.Creatable: {
          if (value === undefined || value === null) {
            if (required) return err(requiredError(fieldPath));
            continue;
          }
          if (!creatable) continue;
          const res = useAssign && creatable.assign
            ? creatable.assign(value)
            : creatable.create(value, fieldPath);
          if (!res.success) return res;
          props[key] = res.value;
          break;
        }

        case FieldKind.ArrayCreatable: {
          if (value === undefined || value === null) {
            if (required) return err(requiredError(fieldPath));
            continue;
          }
          if (!Array.isArray(value)) {
            return err(ExceptionValidation.create(fieldPath, "Esperado array."));
          }
          if (!creatable) continue;
          const arr: unknown[] = [];
          for (let j = 0; j < value.length; j++) {
            const item = value[j];
            if (required && (item === undefined || item === null)) {
              return err(requiredError(`${fieldPath}[${j}]`));
            }
            const res = useAssign && creatable.assign
              ? creatable.assign(item)
              : creatable.create(item, `${fieldPath}[${j}]`);
            if (!res.success) return res;
            arr.push(res.value);
          }
          props[key] = arr;
          break;
        }

        case FieldKind.NestedSchema: {
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

        case FieldKind.ArrayNestedSchema: {
          if (value === undefined || value === null) {
            if (required) return err(requiredError(fieldPath));
            continue;
          }
          if (!Array.isArray(value)) {
            return err(ExceptionValidation.create(fieldPath, "Esperado array."));
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

// ── Public API ───────────────────────────────────────────────────

export interface ICompiledSchema<TSchema extends ISchema> {
  create(data: InferJson<TSchema>, path?: string): Result<InferProps<TSchema>, Exceptions>;
  assign(data: InferJson<TSchema>, path?: string): Result<InferProps<TSchema>, Exceptions>;
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
      assign(data: InferJson<TSchema>, path = ""): Result<InferProps<TSchema>, Exceptions> {
        const result = runner(data, path, "assign");
        assertResultType<InferProps<TSchema>>(result);
        return result;
      },
    };
  }

}
