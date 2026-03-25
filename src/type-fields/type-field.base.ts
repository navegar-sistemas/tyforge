import { err, ok, Result, OK_TRUE } from "@tyforge/result";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { ExceptionValidation } from "@tyforge/exceptions";
import { ITypeFieldConfig } from "./type-field.config";
import { tyforgeConfig } from "@tyforge/config/tyforge-config";

export { TJsonSchemaType } from "./type-field.config";

export type TValidationLevel = "full" | "type" | "none";

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

// Cache de Set para lookup O(1) em validação de enum
const enumSetCache = new WeakMap<object, Set<unknown>>();

function getCachedEnumSet(enumObj: object): Set<unknown> {
  let cached = enumSetCache.get(enumObj);
  if (!cached) {
    cached = new Set(getCachedEnumValues(enumObj));
    enumSetCache.set(enumObj, cached);
  }
  return cached;
}

function isEnumValue<E extends Record<string, string | number>>(
  value: unknown,
  enumSet: Set<unknown>,
): value is E[keyof E] {
  return enumSet.has(value);
}

export abstract class TypeField<TPrimitive, TFormatted = TPrimitive> {
  protected static readonly createLevel = tyforgeConfig.schema.validate.create;
  protected static readonly assignLevel = tyforgeConfig.schema.validate.assign;

  abstract readonly typeInference: string;
  abstract readonly config: ITypeFieldConfig<TPrimitive>;

  protected constructor(
    protected readonly _value: TPrimitive,
    protected readonly fieldPath: string,
  ) {}

  protected static normalize<T extends string>(raw: T, validateLevel?: TValidationLevel, trim?: boolean): T;
  protected static normalize<T>(raw: T, validateLevel?: TValidationLevel, trim?: boolean): T;
  protected static normalize(raw: unknown, validateLevel: TValidationLevel = "full", trim = true): unknown {
    if (validateLevel === "none") return raw;
    if (trim && typeof raw === "string") return raw.trim();
    return raw;
  }

  /**
   * Resolve um valor de enum, validando por chave e/ou valor conforme config
   */
  protected static resolveEnum<E extends Record<string, string | number>>(
    enumObj: E,
    raw: unknown,
    fieldPath: string,
  ): Result<E[keyof E], ExceptionValidation> {
    const enumSet = getCachedEnumSet(enumObj);
    if (isEnumValue<E>(raw, enumSet)) {
      return ok(raw);
    }
    return err(
      ExceptionValidation.create(
        fieldPath,
        `Valor de enum inválido: ${typeof raw === "string" ? raw : JSON.stringify(raw)}`,
      ),
    );
  }

  /**
   * Validates the value against the configured schema.
   * @param validateLevel Controls validation depth:
   *   - "full": type + range/length + enum (default)
   *   - "type": type check only (no range/length, no enum)
   *   - "none": skip all validation
   */
  protected validate(
    value: TPrimitive,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    if (validateLevel === "none") return OK_TRUE;

    const { jsonSchemaType } = this.config;
    const skipRange = validateLevel === "type";

    // Enum validation only runs in "full" mode
    if (!skipRange && "validateEnum" in this.config && this.config.validateEnum) {
      const enumSet = getCachedEnumSet(this.config.validateEnum);
      if (!enumSet.has(value)) {
        const enumValues = getCachedEnumValues(this.config.validateEnum);
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
        const cfg = this.config;
        const strResult = TypeGuard.isString(
          value,
          fieldPath,
          skipRange ? 0 : ("minLength" in cfg ? cfg.minLength : undefined),
          skipRange ? undefined : ("maxLength" in cfg ? cfg.maxLength : undefined),
        );
        if (!strResult.success) return err(strResult.error);
        return OK_TRUE;
      }
      case "number": {
        const cfg = this.config;
        return TypeGuard.isNumber(
          value,
          fieldPath,
          skipRange ? undefined : ("min" in cfg ? cfg.min : undefined),
          skipRange ? undefined : ("max" in cfg ? cfg.max : undefined),
          skipRange ? undefined : ("decimalPrecision" in cfg ? cfg.decimalPrecision : undefined),
        );
      }
      case "boolean":
        return TypeGuard.isBoolean(value, fieldPath);
      case "object":
        return TypeGuard.isObject(value, fieldPath);
      case "array": {
        const cfg = this.config;
        return TypeGuard.isArray(
          value,
          fieldPath,
          skipRange ? 0 : ("minItems" in cfg ? cfg.minItems ?? 0 : 0),
          skipRange ? undefined : ("maxItems" in cfg ? cfg.maxItems ?? Infinity : Infinity),
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
