import { err, ok, Result } from "@tyforge/result";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { ExceptionValidation } from "@tyforge/exceptions";
import { ITypeFieldConfig } from "./type-field.config";

export { TJsonSchemaType } from "./type-field.config";

// Cache de Object.values() para evitar alocação repetida
const enumValuesCache = new WeakMap<object, unknown[]>();

function getCachedEnumValues(enumObj: object): unknown[] {
  let cached = enumValuesCache.get(enumObj);
  if (!cached) {
    cached = Object.values(enumObj);
    enumValuesCache.set(enumObj, cached);
  }
  return cached;
}

export abstract class TypeField<TPrimitive, TFormatted = TPrimitive> {
  /** Nome usado para inferência de tipo */
  abstract readonly typeInference: string;
  /** Configurações de validação e serialização */
  abstract readonly config: ITypeFieldConfig<TPrimitive>;

  protected constructor(
    protected readonly _value: TPrimitive,
    protected readonly fieldPath: string,
  ) {}

  /**
   * Resolve um valor de enum, validando por chave e/ou valor conforme config
   */
  protected static resolveEnum<E extends Record<string, string | number>>(
    enumObj: E,
    raw: unknown,
    fieldPath: string,
  ): Result<E[keyof E], ExceptionValidation> {
    const enumValues = getCachedEnumValues(enumObj);
    if (enumValues.includes(raw as E[keyof E])) {
      return ok(raw as E[keyof E]);
    }
    return err(
      ExceptionValidation.create(
        fieldPath,
        `Valor de enum inválido: ${typeof raw === "string" ? raw : JSON.stringify(raw)}`,
      ),
    );
  }

  /**
   * Valida o valor contra o schema configurado
   */
  protected validate(
    value: TPrimitive,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const { jsonSchemaType } = this.config;

    // Validação de enum se configurado (com cache)
    if ("validateEnum" in this.config && this.config.validateEnum) {
      const enumValues = getCachedEnumValues(this.config.validateEnum);
      if (!enumValues.includes(value)) {
        return err(
          ExceptionValidation.create(
            fieldPath,
            `Valor deve pertencer ao enum: ${enumValues.join(", ")}`,
          ),
        );
      }
    }

    switch (jsonSchemaType) {
      case "string": {
        const cfg = this.config as ITypeFieldConfig<string>;
        return TypeGuard.isString(
          value,
          fieldPath,
          cfg.minLength,
          cfg.maxLength,
        );
      }
      case "number": {
        const cfg = this.config as ITypeFieldConfig<number>;
        return TypeGuard.isNumber(
          value,
          fieldPath,
          cfg.min,
          cfg.max,
          cfg.decimalPrecision,
        );
      }
      case "boolean":
        return TypeGuard.isBoolean(value, fieldPath);
      case "object":
        return TypeGuard.isObject(value, fieldPath);
      case "array": {
        const cfg = this.config as ITypeFieldConfig<unknown[]>;
        return TypeGuard.isArray(
          value,
          fieldPath,
          cfg.minItems ?? 0,
          cfg.maxItems ?? Infinity,
        );
      }
      case "Date":
        return TypeGuard.isDate(value, fieldPath);
      default:
        return err(
          ExceptionValidation.create(
            fieldPath,
            `Tipo de valor não suportado: ${typeof jsonSchemaType === "string" ? jsonSchemaType : JSON.stringify(jsonSchemaType)}`,
          ),
        );
    }
  }

  /** Retorna o valor primitivo bruto */
  getValue(): TPrimitive {
    return this._value;
  }

  abstract getDescription(): string;
  abstract getShortDescription(): string;
  abstract formatted(): TFormatted;

  equals(other?: TypeField<TPrimitive, TFormatted>): boolean {
    return (
      !!other &&
      other.constructor === this.constructor &&
      other._value === this._value
    );
  }

  toString(): string {
    return String(this._value);
  }

  toInt(): Result<number, ExceptionValidation> {
    if (typeof this._value === "number") return ok(this._value);
    if (typeof this._value === "string") {
      const parsed = parseInt(this._value, 10);
      if (isNaN(parsed)) {
        return err(ExceptionValidation.create(this.fieldPath, "Valor não pode ser convertido para inteiro."));
      }
      return ok(parsed);
    }
    return err(ExceptionValidation.create(this.fieldPath, "toInt só pode ser usado com strings ou números."));
  }

  getDocumentationAux(): {
    value: TPrimitive;
    formatted: TFormatted;
    description: string;
  } {
    return {
      value: this.getValue(),
      formatted: this.formatted(),
      description: this.getDescription(),
    };
  }

  isEmpty(): boolean {
    return TypeGuard.isEmpty(this._value);
  }

  toJSON(): TPrimitive | string {
    return this.config.serializeAsString ? this.toString() : this.getValue();
  }
}
