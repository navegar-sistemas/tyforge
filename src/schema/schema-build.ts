import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import {
  ISchemaAllowedEntry,
  ISchemaFieldConfig,
  ISchemaInferJson,
  ISchemaInferProps,
  ISchemaInlineObject,
} from "./schema-types";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { err, isFailure, ok, Result } from "@tyforge/result";

/** Campo no schema que define VO/Entity ou inline */
function isFieldConfig(
  entry: ISchemaAllowedEntry,
): entry is ISchemaFieldConfig {
  return (entry as ISchemaFieldConfig).type !== undefined;
}

const requiredError = (path: string) =>
  ExceptionValidation.create(path, "Campo obrigatório ausente.");

type Creatable = {
  create(value: unknown, fieldPath?: string): Result<unknown, Exceptions>;
  assign?(value: unknown): Result<unknown, Exceptions>;
};

// ── Compiled Schema ─────────────────────────────────────────────

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

function compileFields(schema: ISchemaInlineObject, basePath: string): CompiledField[] {
  const fields: CompiledField[] = [];

  for (const key of Object.keys(schema)) {
    let entry = schema[key];
    const path = basePath ? `${basePath}.${key}` : key;

    // Array syntax [{ type, required }]
    if (Array.isArray(entry)) {
      const cfg = entry[0] as ISchemaFieldConfig;
      entry = { type: cfg.type, required: cfg.required, isArray: true };
    }

    if (isFieldConfig(entry)) {
      const t = entry.type;
      const creatable = t as Creatable;
      const isCreatable = typeof creatable.create === "function";
      const isArray = entry.isArray === true;

      if (isArray) {
        fields.push({
          key,
          path,
          required: entry.required !== false,
          kind: isCreatable ? FieldKind.ArrayCreatable : FieldKind.ArrayNestedSchema,
          creatable: isCreatable ? creatable : null,
          hasAssign: isCreatable && typeof creatable.assign === "function",
          nestedValidator: !isCreatable ? { fields: compileFields(t as ISchemaInlineObject, ""), run: createRunner(t as ISchemaInlineObject) } : null,
        });
      } else {
        fields.push({
          key,
          path,
          required: entry.required !== false,
          kind: isCreatable ? FieldKind.Creatable : FieldKind.NestedSchema,
          creatable: isCreatable ? creatable : null,
          hasAssign: isCreatable && typeof creatable.assign === "function",
          nestedValidator: !isCreatable ? { fields: compileFields(t as ISchemaInlineObject, path), run: createRunner(t as ISchemaInlineObject) } : null,
        });
      }
    } else {
      // Inline nested object (no {type:...})
      fields.push({
        key,
        path,
        required: true,
        kind: FieldKind.NestedSchema,
        creatable: null,
        hasAssign: false,
        nestedValidator: { fields: compileFields(entry as ISchemaInlineObject, path), run: createRunner(entry as ISchemaInlineObject) },
      });
    }
  }

  return fields;
}

function createRunner(schema: ISchemaInlineObject) {
  let compiled: CompiledField[] | null = null;

  return function run(data: unknown, basePath: string, mode: "create" | "assign"): Result<Record<string, unknown>, Exceptions> {
    if (!compiled) compiled = compileFields(schema, basePath);

    if (!data || typeof data !== "object") {
      return err(ExceptionValidation.create(basePath || "root", "Dados obrigatórios ausentes."));
    }

    const dataRecord = data as Record<string, unknown>;
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
          if (!res.success) return res;
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
            if (!res.success) return res;
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
          if (!nested.success) return nested;
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
            if (!nested.success) return nested;
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

export interface CompiledSchema<TSchema extends ISchemaInlineObject> {
  create(data: ISchemaInferJson<TSchema>, path?: string): Result<ISchemaInferProps<TSchema>, Exceptions>;
  assign(data: ISchemaInferJson<TSchema>, path?: string): Result<ISchemaInferProps<TSchema>, Exceptions>;
}

export class SchemaBuilder {
  /**
   * Compila o schema uma vez e retorna um validador otimizado.
   * Uso: const validator = SchemaBuilder.compile(schema);
   *      validator.create(data, "user");
   */
  static compile<TSchema extends ISchemaInlineObject>(
    schema: TSchema,
  ): CompiledSchema<TSchema> {
    const runner = createRunner(schema);

    return {
      create(data: ISchemaInferJson<TSchema>, path = ""): Result<ISchemaInferProps<TSchema>, Exceptions> {
        return runner(data, path, "create") as Result<ISchemaInferProps<TSchema>, Exceptions>;
      },
      assign(data: ISchemaInferJson<TSchema>, path = ""): Result<ISchemaInferProps<TSchema>, Exceptions> {
        return runner(data, path, "assign") as Result<ISchemaInferProps<TSchema>, Exceptions>;
      },
    };
  }

  /**
   * Constrói props validados a partir de schema e dados JSON (não-compilado, backward compatible)
   */
  static build<TSchema extends ISchemaInlineObject>(
    schema: TSchema,
    data: ISchemaInferJson<TSchema>,
    path = "",
    mode: "create" | "assign",
  ): Result<ISchemaInferProps<TSchema>, Exceptions> {
    const schemaKeys = Object.keys(schema);

    if (schemaKeys.length > 0) {
      if (!data || typeof data !== "object") {
        return err(
          ExceptionValidation.create(
            path || "root",
            "Dados obrigatórios ausentes.",
          ),
        );
      }
    }

    const props: Partial<ISchemaInferProps<TSchema>> = {};

    for (const key of schemaKeys) {
      let entry = schema[key as keyof TSchema];
      const fieldPath = path ? `${path}.${key}` : key;
      const value = (data as Record<string, unknown>)[key];

      // Suporte à sintaxe [ { type, required } ] → converte pra isArray:true
      if (Array.isArray(entry)) {
        const cfg = entry[0] as ISchemaFieldConfig;
        entry = {
          type: cfg.type,
          required: cfg.required,
          isArray: true,
        } as TSchema[keyof TSchema];
      }

      // 1) Campo array (isArray: true)
      if (isFieldConfig(entry) && entry.isArray) {
        const arrayReq = entry.required !== false;

        if (value === undefined || value === null) {
          if (arrayReq) return err(requiredError(fieldPath));
          continue;
        }
        if (!Array.isArray(value))
          return err(ExceptionValidation.create(fieldPath, "Esperado array."));

        const itemReq = entry.required !== false;
        const arr: unknown[] = [];

        for (let i = 0; i < (value as unknown[]).length; i++) {
          const item = (value as unknown[])[i];
          const idxPath = `${fieldPath}[${i}]`;

          if (itemReq && (item === undefined || item === null)) {
            return err(requiredError(idxPath));
          }

          const t = entry.type;
          const creatable = t as Creatable;
          if (typeof creatable.create === "function") {
            const res =
              mode === "create"
                ? creatable.create(item, idxPath)
                : typeof creatable.assign === "function"
                  ? creatable.assign(item)
                  : creatable.create(item, idxPath);
            if (isFailure(res)) return res;
            arr.push(res.value);
          } else {
            const nested = SchemaBuilder.build(
              t as ISchemaInlineObject,
              item as ISchemaInferJson<ISchemaInlineObject>,
              idxPath,
              mode,
            );
            if (isFailure(nested)) return nested;
            arr.push(nested.value);
          }
        }

        (props as Record<string, unknown>)[key] = arr;
        continue;
      }

      // 2) Campo simples (VO/Entity ou inline objeto)
      if (isFieldConfig(entry)) {
        const isReq = entry.required !== false;
        if (value === undefined || value === null) {
          if (isReq) return err(requiredError(fieldPath));
          continue;
        }

        const t = entry.type;
        const creatableField = t as Creatable;
        if (typeof creatableField.create === "function") {
          const res =
            mode === "create"
              ? creatableField.create(value, fieldPath)
              : typeof creatableField.assign === "function"
                ? creatableField.assign(value)
                : creatableField.create(value, fieldPath);
          if (isFailure(res)) return res;
          (props as Record<string, unknown>)[key] = res.value;
        } else {
          const nested = SchemaBuilder.build(
            t as ISchemaInlineObject,
            value as ISchemaInferJson<ISchemaInlineObject>,
            fieldPath,
            mode,
          );
          if (isFailure(nested)) return nested;
          (props as Record<string, unknown>)[key] = nested.value;
        }

        continue;
      }

      // 3) Objeto aninhado pelo próprio schema (sem {type:...})
      if (value === undefined || value === null) {
        return err(requiredError(fieldPath));
      }
      const nested = SchemaBuilder.build(
        entry,
        value as ISchemaInferJson<ISchemaInlineObject>,
        fieldPath,
        mode,
      );
      if (isFailure(nested)) return nested;
      (props as Record<string, unknown>)[key] = nested.value;
    }

    return ok(props as ISchemaInferProps<TSchema>);
  }
}
