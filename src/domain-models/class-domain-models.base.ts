import { FDate } from "@tyforge/type-fields/date.format_vo";
import { Class } from "./class.base";

function assertType<T>(value: unknown): asserts value is T {
  void value;
}

export abstract class ClassDomainModels<TProps, TPropsJson> extends Class {
  constructor() {
    super();
  }

  abstract equals(input: ClassDomainModels<TProps, TPropsJson>): boolean;

  /**
   * Função utilitária para converter objetos com Value Objects para primitivos
   * Reutilizada por toJSON e toPrimitives
   */
  private static deepUnwrap(
    input: unknown,
    config?: { date: `string` | `date` },
  ): unknown {
    if (Array.isArray(input)) {
      return input.map((item) => ClassDomainModels.deepUnwrap(item, config));
    }

    if (input && typeof input === "object") {
      // se for um ValueObject ou DTO com toJSON
      if ("toJSON" in input && typeof input.toJSON === "function") {
        return input.toJSON(config);
      }

      // se for um TypeField
      if ("getValue" in input && typeof input.getValue === "function") {
        if (input instanceof FDate && config?.date === `string`) {
          return input.toString();
        } else {
          return input.getValue();
        }
      }

      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(input)) {
        // pula campos undefined
        if (value === undefined) continue;
        result[key] = ClassDomainModels.deepUnwrap(value, config);
      }
      return result;
    }

    return input;
  }

  /**
   * Converte objetos com Value Objects para tipos primitivos
   * Reutiliza a lógica de deepUnwrap do toJSON
   */
  static toPrimitives<TInput, TOutput>(input: TInput): TOutput {
    const result = ClassDomainModels.deepUnwrap(input);
    assertType<TOutput>(result);
    return result;
  }

  public toJSON(config?: { date: `string` | `date` }): TPropsJson {
    config = config || { date: `string` };

    const fields: Record<string, unknown> = {};
    const ownPropertyNames = Object.getOwnPropertyNames(this);
    const prototypePropertyNames = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

    const allPropertyNames = [
      ...new Set([...ownPropertyNames, ...prototypePropertyNames]),
    ];

    for (const propertyName of allPropertyNames) {
      if (propertyName === "constructor") continue;
      if (propertyName.startsWith("_")) continue;

      const value: unknown = Reflect.get(this, propertyName);

      if (typeof value !== "function" && value !== undefined) {
        fields[propertyName] = value;
      }
    }

    const result = ClassDomainModels.deepUnwrap(fields, config);
    assertType<TPropsJson>(result);
    return result;
  }
}
