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

export class SchemaBuilder {
  /**
   * Constrói props validados a partir de schema e dados JSON
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

    for (const key of Object.keys(schema) as (keyof TSchema)[]) {
      let entry = schema[key];
      const fieldPath = path ? `${path}.${String(key)}` : String(key);
      const value = (data as Record<string, unknown>)[String(key)];

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
        // array obrigatório por padrão, só false se required === false
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
          // Se t tiver create → VO/Entity
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
            // é schema inline
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

        (props as Record<string, unknown>)[String(key)] = arr;
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
          // VO/Entity
          const res =
            mode === "create"
              ? creatableField.create(value, fieldPath)
              : typeof creatableField.assign === "function"
                ? creatableField.assign(value)
                : creatableField.create(value, fieldPath);
          if (isFailure(res)) return res;
          (props as Record<string, unknown>)[String(key)] = res.value;
        } else {
          // inline object
          const nested = SchemaBuilder.build(
            t as ISchemaInlineObject,
            value as ISchemaInferJson<ISchemaInlineObject>,
            fieldPath,
            mode,
          );
          if (isFailure(nested)) return nested;
          (props as Record<string, unknown>)[String(key)] = nested.value;
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
      (props as Record<string, unknown>)[String(key)] = nested.value;
    }

    return ok(props as ISchemaInferProps<TSchema>);
  }
}
