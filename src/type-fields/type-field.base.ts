import { err, ok, Result, OK_TRUE } from "@tyforge/result";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { ExceptionValidation } from "@tyforge/exceptions";
import { ITypeFieldConfig } from "./type-field.config";

export { TJsonSchemaType } from "./type-field.config";

export type TValidationLevel = "full" | "type" | "none";
export type TLocaleDisplay = "us" | "br";
export type TLocaleRules = "us" | "br";

const LOCALE_INTL: Record<TLocaleDisplay, string> = {
  us: "en-US",
  br: "pt-BR",
};

// Cache Object.values() to avoid repeated allocation
const enumValuesCache = new WeakMap<object, unknown[]>();

function getCachedEnumValues(enumObj: object): unknown[] {
  let cached = enumValuesCache.get(enumObj);
  if (!cached) {
    cached = Object.values(enumObj);
    enumValuesCache.set(enumObj, cached);
  }
  return cached;
}

// Cache Set for O(1) lookup in enum validation
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
  static createLevel: TValidationLevel = "full";
  static assignLevel: TValidationLevel = "type";
  static localeDisplay: TLocaleDisplay = "us";
  static localeRules: TLocaleRules = "us";

  static configure(options: {
    create?: TValidationLevel;
    assign?: TValidationLevel;
    localeDisplay?: TLocaleDisplay;
    localeRules?: TLocaleRules;
  }): void {
    if (options.create !== undefined) TypeField.createLevel = options.create;
    if (options.assign !== undefined) TypeField.assignLevel = options.assign;
    if (options.localeDisplay !== undefined) TypeField.localeDisplay = options.localeDisplay;
    if (options.localeRules !== undefined) TypeField.localeRules = options.localeRules;
  }

  protected static assertNeverLocale(locale: never): never {
    throw new Error(`Unhandled locale: ${String(locale)}`);
  }

  private static formatterCache = new Map<string, Intl.NumberFormat>();

  protected static formatNumber(
    value: number,
    options?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
  ): string {
    const locale = LOCALE_INTL[TypeField.localeDisplay];
    const key = `${locale}:${options?.minimumFractionDigits ?? ""}:${options?.maximumFractionDigits ?? ""}`;
    let formatter = TypeField.formatterCache.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, options);
      TypeField.formatterCache.set(key, formatter);
    }
    return formatter.format(value);
  }

  // Progressive mask: applies separators only when enough digits exist.
  // Pattern example: [3, ".", 3, ".", 3, "-", 2] for CPF (XXX.XXX.XXX-XX).
  protected static applyMask(value: string, pattern: (number | string)[]): string {
    let result = "";
    let pos = 0;
    for (const part of pattern) {
      if (pos >= value.length) break;
      if (typeof part === "number") {
        result += value.substring(pos, pos + part);
        pos += part;
      } else {
        if (pos < value.length) result += part;
      }
    }
    return result;
  }

  // Normalizes form input (always string) to the expected primitive type.
  // Called by formCreate/formAssign before delegating to create/assign.
  // Rejects hex (0x), octal (0o), binary (0b), scientific notation (1e5), Infinity.
  // Supports locale decimal separators: "10,50" → 10.50 (comma → dot).
  private static readonly FORM_NUMBER_REGEX = /^-?\d+([.,]\d+)?$/;

  static normalizeFormInput(value: unknown, targetType: string): unknown {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    switch (targetType) {
      case "number": {
        if (trimmed === "") return trimmed;
        if (!TypeField.FORM_NUMBER_REGEX.test(trimmed)) return trimmed;
        const normalized = trimmed.replace(",", ".");
        const n = Number(normalized);
        return isNaN(n) ? trimmed : n;
      }
      case "boolean": {
        const lower = trimmed.toLowerCase();
        if (lower === "true" || lower === "1") return true;
        if (lower === "false" || lower === "0") return false;
        return trimmed;
      }
      default:
        return trimmed;
    }
  }

  abstract readonly typeInference: string;
  abstract readonly config: ITypeFieldConfig<TPrimitive>;

  protected constructor(
    protected readonly _value: TPrimitive,
    protected readonly fieldPath: string,
  ) {}

  /**
   * Resolves an enum value, validating by key and/or value according to config
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
        "Invalid enum value",
      ),
    );
  }

  protected validateRules(
    value: TPrimitive,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    if (validateLevel === "none") return OK_TRUE;

    const cfg = this.config;
    const skipRange = validateLevel === "type";

    if (!skipRange && "validateEnum" in cfg && cfg.validateEnum) {
      const enumSet = getCachedEnumSet(cfg.validateEnum);
      if (!enumSet.has(value)) {
        const enumValues = getCachedEnumValues(cfg.validateEnum);
        return err(
          ExceptionValidation.create(
            fieldPath,
            `Value must be one of: ${enumValues.join(", ")}`,
          ),
        );
      }
    }

    if (skipRange) return OK_TRUE;

    switch (cfg.jsonSchemaType) {
      case "string": {
        const len = String(value).length;
        if ("maxLength" in cfg && len > cfg.maxLength) {
          return err(ExceptionValidation.create(fieldPath, `String must contain at most ${cfg.maxLength} characters.`));
        }
        if ("minLength" in cfg && len < cfg.minLength) {
          return err(ExceptionValidation.create(fieldPath, `String must contain at least ${cfg.minLength} characters.`));
        }
        return OK_TRUE;
      }
      case "number": {
        const n = Number(value);
        if ("max" in cfg && n > cfg.max) {
          return err(ExceptionValidation.create(fieldPath, `Value must be at most ${cfg.max}.`));
        }
        if ("min" in cfg && n < cfg.min) {
          return err(ExceptionValidation.create(fieldPath, `Value must be at least ${cfg.min}.`));
        }
        if ("decimalPrecision" in cfg) {
          const [, decimals] = n.toString().split(".");
          if ((decimals?.length ?? 0) > cfg.decimalPrecision) {
            return err(ExceptionValidation.create(fieldPath, `Value must have at most ${cfg.decimalPrecision} decimal places.`));
          }
        }
        return OK_TRUE;
      }
      default:
        return OK_TRUE;
    }
  }

  /** Returns the raw primitive value */
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
        return err(ExceptionValidation.create(this.fieldPath, "Value cannot be converted to integer."));
      }
      return ok(parsed);
    }
    return err(ExceptionValidation.create(this.fieldPath, "toInt can only be used with strings or numbers."));
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
