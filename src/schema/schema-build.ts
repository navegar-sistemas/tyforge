import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import {
  Schema,
  InferJson,
  InferProps,
} from "./schema-types";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { err, isFailure, ok, Result } from "@tyforge/result";

// ── Type Guards (zero casts) ────────────────────────────────────

type Creatable = {
  create(value: unknown, fieldPath?: string): Result<unknown, Exceptions>;
  assign?(value: unknown): Result<unknown, Exceptions>;
};

function hasType(entry: unknown): entry is { type: unknown; required?: boolean; isArray?: boolean } {
  return !!entry && typeof entry === "object" && "type" in entry;
}

function isCreatable(t: unknown): t is Creatable {
  return !!t && typeof t === "object" && "create" in t && typeof t.create === "function";
}

function hasAssign(t: Creatable): boolean {
  return typeof t.assign === "function";
}

function assertResultType<T>(result: Result<unknown, Exceptions>): asserts result is Result<T, Exceptions> {
  void result;
}

function validateObject(data: unknown, path: string): Result<Record<string, unknown>, Exceptions> {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return err(ExceptionValidation.create(path || "root", "Dados obrigatórios ausentes."));
  }
  const record: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    record[k] = v;
  }
  return ok(record);
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
        const nested = Object.fromEntries(Object.entries(t));
        fields.push({
          key, path,
          required: entry.required !== false,
          kind: isArray ? FieldKind.ArrayNestedSchema : FieldKind.NestedSchema,
          creatable: null,
          hasAssign: false,
          nestedValidator: { fields: compileFields(nested, isArray ? "" : path), run: createRunner(nested) },
        });
      }
    } else if (!!entry && typeof entry === "object" && !Array.isArray(entry)) {
      const nested = Object.fromEntries(Object.entries(entry));
      fields.push({
        key, path,
        required: true,
        kind: FieldKind.NestedSchema,
        creatable: null,
        hasAssign: false,
        nestedValidator: { fields: compileFields(nested, path), run: createRunner(nested) },
      });
    }
  }

  return fields;
}

function createRunner(schema: Record<string, unknown>) {
  let compiled: CompiledField[] | null = null;

  return function run(data: unknown, basePath: string, mode: "create" | "assign"): Result<Record<string, unknown>, Exceptions> {
    if (!compiled) compiled = compileFields(schema, basePath);

    const validated = validateObject(data, basePath);
    if (isFailure(validated)) return validated;
    const dataRecord = validated.value;

    const props: Record<string, unknown> = {};

    for (let i = 0; i < compiled.length; i++) {
      const field = compiled[i];
      const value = dataRecord[field.key];

      switch (field.kind) {
        case FieldKind.Creatable: {
          if (value === undefined || value === null) {
            if (field.required) return err(requiredError(field.path));
            continue;
          }
          const res = mode === "create" || !field.hasAssign
            ? field.creatable!.create(value, field.path)
            : field.creatable!.assign!(value);
          if (isFailure(res)) return res;
          props[field.key] = res.value;
          break;
        }

        case FieldKind.ArrayCreatable: {
          if (value === undefined || value === null) {
            if (field.required) return err(requiredError(field.path));
            continue;
          }
          if (!Array.isArray(value)) {
            return err(ExceptionValidation.create(field.path, "Esperado array."));
          }
          const arr: unknown[] = [];
          for (let j = 0; j < value.length; j++) {
            const item = value[j];
            const idxPath = `${field.path}[${j}]`;
            if (field.required && (item === undefined || item === null)) {
              return err(requiredError(idxPath));
            }
            const res = mode === "create" || !field.hasAssign
              ? field.creatable!.create(item, idxPath)
              : field.creatable!.assign!(item);
            if (isFailure(res)) return res;
            arr.push(res.value);
          }
          props[field.key] = arr;
          break;
        }

        case FieldKind.NestedSchema: {
          if (value === undefined || value === null) {
            if (field.required) return err(requiredError(field.path));
            continue;
          }
          const nested = field.nestedValidator!.run(value, field.path, mode);
          if (isFailure(nested)) return nested;
          props[field.key] = nested.value;
          break;
        }

        case FieldKind.ArrayNestedSchema: {
          if (value === undefined || value === null) {
            if (field.required) return err(requiredError(field.path));
            continue;
          }
          if (!Array.isArray(value)) {
            return err(ExceptionValidation.create(field.path, "Esperado array."));
          }
          const arr: unknown[] = [];
          for (let j = 0; j < value.length; j++) {
            const item = value[j];
            const idxPath = `${field.path}[${j}]`;
            if (field.required && (item === undefined || item === null)) {
              return err(requiredError(idxPath));
            }
            const nested = field.nestedValidator!.run(item, idxPath, mode);
            if (isFailure(nested)) return nested;
            arr.push(nested.value);
          }
          props[field.key] = arr;
          break;
        }
      }
    }

    return ok(props);
  };
}

// ── Public API ───────────────────────────────────────────────────

export interface CompiledSchema<TSchema extends Schema> {
  create(data: InferJson<TSchema>, path?: string): Result<InferProps<TSchema>, Exceptions>;
  assign(data: InferJson<TSchema>, path?: string): Result<InferProps<TSchema>, Exceptions>;
}

export class SchemaBuilder {
  static compile<TSchema extends Schema>(
    schema: TSchema,
  ): CompiledSchema<TSchema> {
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

  static build<TSchema extends Schema>(
    schema: TSchema,
    data: InferJson<TSchema>,
    path = "",
    mode: "create" | "assign",
  ): Result<InferProps<TSchema>, Exceptions> {
    const compiled = SchemaBuilder.compile(schema);
    return mode === "create" ? compiled.create(data, path) : compiled.assign(data, path);
  }
}
