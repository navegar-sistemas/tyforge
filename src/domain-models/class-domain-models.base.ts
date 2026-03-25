import { FDate } from "@tyforge/type-fields/date.format_vo";
import { Class } from "./class.base";
import type { ISchema, IFieldConfig, TExposeLevel, SchemaEntry } from "@tyforge/schema/schema-types";
import { getVisibilityLevel } from "@tyforge/schema/schema-types";

function isFieldConfig(entry: SchemaEntry): entry is IFieldConfig {
  return !Array.isArray(entry) && "type" in entry;
}

function assertType<T>(value: unknown): asserts value is T {
  if (value !== null && typeof value !== "object" && typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError(`assertType: unexpected type ${typeof value}`);
  }
}

// Property names cache per prototype to avoid recomputation in toJSON()
const propertyNamesCache = new WeakMap<object, string[]>();

export abstract class ClassDomainModels<TProps, TPropsJson> extends Class {
  protected readonly _schema?: ISchema;

  protected constructor() {
    super();
  }

  abstract equals(input: ClassDomainModels<TProps, TPropsJson>): boolean;

  /**
   * Utility function to convert objects with Value Objects to primitives.
   * Reused by toJSON and toPrimitives.
   */
  private static deepUnwrap(
    input: unknown,
    config?: { date: `string` | `date` },
    visited?: WeakSet<object>,
  ): unknown {
    if (Array.isArray(input)) {
      return input.map((item) => ClassDomainModels.deepUnwrap(item, config, visited));
    }

    if (input && typeof input === "object") {
      // Circular reference guard
      if (visited) {
        if (visited.has(input)) return undefined;
        visited.add(input);
      }

      // If it's a ValueObject or DTO with toJSON
      if ("toJSON" in input && typeof input.toJSON === "function") {
        return input.toJSON(config);
      }

      // If it's a TypeField
      if ("getValue" in input && typeof input.getValue === "function") {
        if (input instanceof FDate && config?.date === `string`) {
          return input.toString();
        } else {
          return input.getValue();
        }
      }

      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        // Skip undefined fields
        if (value === undefined) continue;
        result[key] = ClassDomainModels.deepUnwrap(value, config, visited);
      }
      return result;
    }

    return input;
  }

  /**
   * Converts objects with Value Objects to primitive types.
   * Reuses the deepUnwrap logic from toJSON.
   */
  static toPrimitives<TInput, TOutput>(input: TInput): TOutput {
    const result = ClassDomainModels.deepUnwrap(input, undefined, new WeakSet());
    assertType<TOutput>(result);
    return result;
  }

  public toJSON(config?: { date: `string` | `date` }, exposeLevel?: TExposeLevel): TPropsJson {
    config = config || { date: `string` };

    const fields: Record<string, unknown> = {};
    const proto = Object.getPrototypeOf(this);

    let allPropertyNames = propertyNamesCache.get(proto);
    if (!allPropertyNames) {
      const ownPropertyNames = Object.getOwnPropertyNames(this);
      const prototypePropertyNames = Object.getOwnPropertyNames(proto);
      allPropertyNames = [
        ...new Set([...ownPropertyNames, ...prototypePropertyNames]),
      ];
      propertyNamesCache.set(proto, allPropertyNames);
    }

    const requestedLevel = getVisibilityLevel(exposeLevel ?? "public");

    for (const propertyName of allPropertyNames) {
      if (propertyName === "constructor") continue;
      if (propertyName.startsWith("_")) continue;

      const value: unknown = Reflect.get(this, propertyName);

      if (typeof value !== "function" && value !== undefined) {
        if (this._schema && propertyName in this._schema) {
          const entry = this._schema[propertyName];
          if (isFieldConfig(entry) && entry.expose) {
            const fieldLevel = getVisibilityLevel(entry.expose);
            if (fieldLevel > requestedLevel) {
              fields[propertyName] = "[REDACTED]";
              continue;
            }
          }
        }
        fields[propertyName] = value;
      }
    }

    const visited = new WeakSet<object>();
    const result = ClassDomainModels.deepUnwrap(fields, config, visited);
    assertType<TPropsJson>(result);
    return result;
  }
}
