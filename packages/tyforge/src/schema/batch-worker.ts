import { parentPort } from "node:worker_threads";
import { SchemaBuilder } from "./schema-build";
import type { ISchema, IFieldConfig } from "./schema-types";
import { TypeGuard } from "../tools/type_guard";
import { isFailure } from "@tyforge/result/result";
import * as typeFields from "@tyforge/type-fields";

function isFieldType(value: unknown): value is IFieldConfig["type"] {
  if (TypeGuard.isRecord(value)) return true;
  return TypeGuard.isCallable(value);
}

function buildFieldEntry(
  serialized: Record<string, unknown>,
  fieldType: IFieldConfig["type"],
): IFieldConfig {
  const req = serialized["required"];
  const isArr = serialized["isArray"];
  if (isArr === true) {
    const entry: IFieldConfig = { type: fieldType, isArray: true };
    if (req === true || req === false) entry.required = req;
    return entry;
  }
  const entry: IFieldConfig = { type: fieldType };
  if (req === true || req === false) entry.required = req;
  return entry;
}

const FIELD_REGISTRY: Record<string, unknown> = typeFields;

interface IWorkerMessage {
  schema: Record<string, unknown>;
  items: unknown[];
  startIndex: number;
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

const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function deserializeSchema(raw: Record<string, unknown>): ISchema {
  const schema: ISchema = {};

  for (const [key, value] of Object.entries(raw)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    if (TypeGuard.isRecord(value) && "type" in value) {
      const typeName = value["type"];
      const nameCheck = TypeGuard.isString(typeName, key);
      if (
        nameCheck.success &&
        Object.prototype.hasOwnProperty.call(FIELD_REGISTRY, nameCheck.value)
      ) {
        const fieldClass = FIELD_REGISTRY[nameCheck.value];
        if (isFieldType(fieldClass)) {
          schema[key] = buildFieldEntry(value, fieldClass);
        }
      }
    } else if (Array.isArray(value) && value.length === 1) {
      const entry = value[0];
      if (TypeGuard.isRecord(entry) && "type" in entry) {
        const typeName = entry["type"];
        const nameCheck = TypeGuard.isString(typeName, key);
        if (
          nameCheck.success &&
          Object.prototype.hasOwnProperty.call(FIELD_REGISTRY, nameCheck.value)
        ) {
          const fieldClass = FIELD_REGISTRY[nameCheck.value];
          if (isFieldType(fieldClass)) {
            schema[key] = [buildFieldEntry(entry, fieldClass)];
          }
        }
      }
    } else if (TypeGuard.isRecord(value)) {
      schema[key] = deserializeSchema(value);
    }
  }

  return schema;
}

function postError(
  port: NonNullable<typeof parentPort>,
  detail: string,
  startIndex = 0,
): void {
  port.postMessage({
    successes: [],
    failures: [{ index: startIndex, error: { detail } }],
  });
}

if (parentPort) {
  const port = parentPort;

  port.on("message", (msg: IWorkerMessage) => {
    const rootCheck = TypeGuard.isObject(msg, "message");
    if (isFailure(rootCheck)) {
      postError(port, "Invalid worker message: expected object");
      return;
    }

    const schemaCheck = TypeGuard.isObject(msg.schema, "schema");
    if (isFailure(schemaCheck)) {
      postError(
        port,
        "Invalid worker message: schema must be an object",
        msg.startIndex,
      );
      return;
    }

    const itemsCheck = TypeGuard.isArray(msg.items, "items");
    if (isFailure(itemsCheck)) {
      postError(
        port,
        "Invalid worker message: items must be an array",
        msg.startIndex,
      );
      return;
    }

    const indexCheck = TypeGuard.isNumber(msg.startIndex, "startIndex");
    if (isFailure(indexCheck)) {
      postError(port, "Invalid worker message: startIndex must be a number");
      return;
    }

    if (msg.items.length > 100000) {
      port.postMessage({
        successes: [],
        failures: [
          {
            index: 0,
            error: { detail: "Chunk exceeds maximum size of 100000 items" },
          },
        ],
      });
      return;
    }

    const schema = deserializeSchema(msg.schema);
    const compiled = SchemaBuilder.compile(schema);

    const successes: IWorkerSuccess[] = [];
    const failures: IWorkerFailure[] = [];

    for (let i = 0; i < msg.items.length; i++) {
      const item = msg.items[i];
      if (!TypeGuard.isRecord(item)) {
        failures.push({
          index: msg.startIndex + i,
          error: { detail: "Expected object" },
        });
        continue;
      }
      const result = compiled.create<unknown>(item);
      if (result.success) {
        successes.push({ index: msg.startIndex + i, value: item });
      } else {
        const errJson = result.error.toJSON();
        if (TypeGuard.isRecord(errJson)) {
          failures.push({ index: msg.startIndex + i, error: errJson });
        } else {
          failures.push({
            index: msg.startIndex + i,
            error: { detail: String(errJson) },
          });
        }
      }
    }

    port.postMessage({ successes, failures } satisfies IWorkerResult);
  });
}
