import { FDate } from "@tyforge/type-fields/date.format_vo";
import { Class } from "./class.base";

export abstract class ClassDomainModels<TProps, TPropsJson> extends Class {
  constructor() {
    super();
  }

  abstract equals(input: ClassDomainModels<TProps, TPropsJson>): boolean;

  /**
   * Função utilitária para converter objetos com Value Objects para primitivos
   * Reutilizada por toJson e toPrimitives
   */
  private static deepUnwrap(
    input: unknown,
    config?: { date: `string` | `date` },
  ): unknown {
    if (Array.isArray(input)) {
      return input.map((item) => ClassDomainModels.deepUnwrap(item, config));
    }

    if (input && typeof input === "object") {
      // se for um ValueObject ou DTO com toJson
      if (typeof (input as { toJson?: () => unknown }).toJson === "function") {
        return (
          input as { toJson: (config?: { date: `string` | `date` }) => unknown }
        ).toJson(config);
      }

      // se for um TypeField
      if (
        typeof (input as { getValue?: () => unknown }).getValue === "function"
      ) {
        if (input instanceof FDate && config?.date === `string`) {
          return input.toString();
        } else {
          return (input as { getValue: () => unknown }).getValue();
        }
      }

      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(
        input as Record<string, unknown>,
      )) {
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
   * Reutiliza a lógica de deepUnwrap do toJson
   */
  // Cast justificado: deepUnwrap faz unwrap recursivo de todos os TypeFields,
  // produzindo a estrutura primitiva correspondente a TOutput.
  // O tipo não pode ser inferido estaticamente porque depende de reflexão em runtime.
  static toPrimitives<TInput, TOutput>(input: TInput): TOutput {
    return ClassDomainModels.deepUnwrap(input) as TOutput;
  }

  public toJson(config?: { date: `string` | `date` }): TPropsJson {
    config = config || { date: `string` };

    const fields: Record<string, unknown> = {};
    const prototype = Object.getPrototypeOf(this) as Record<string, unknown>;
    const ownPropertyNames = Object.getOwnPropertyNames(this);
    const prototypePropertyNames = Object.getOwnPropertyNames(prototype);

    const allPropertyNames = [
      ...new Set([...ownPropertyNames, ...prototypePropertyNames]),
    ];

    for (const propertyName of allPropertyNames) {
      if (propertyName === "constructor") continue;
      if (propertyName.startsWith("_")) continue;

      const value = (this as Record<string, unknown>)[propertyName];

      if (typeof value !== "function" && value !== undefined) {
        fields[propertyName] = value;
      }
    }

    // Cast justificado: deepUnwrap produz a estrutura JSON correspondente ao aggregate.
    // O tipo TPropsJson é definido pelo consumidor e corresponde à saída do unwrap.
    return ClassDomainModels.deepUnwrap(fields, config) as TPropsJson;
  }
}
