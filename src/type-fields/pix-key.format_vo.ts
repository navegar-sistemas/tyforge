import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TPixKey = string;
export type TPixKeyFormatted = string;

const BASE_REGEX = /^[a-zA-Z0-9@.+\-_]+$/;
const DIGITS_ONLY_REGEX = /^\d+$/;
const EVP_REGEX = /^[a-zA-Z0-9-]{32,36}$/;

export class FPixKey extends TypeField<TPixKey, TPixKeyFormatted> {
  override readonly typeInference = "FPixKey";

  override readonly config: ITypeFieldConfig<TPixKey> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 77,
    serializeAsString: false,
  };

  private constructor(value: TPixKey, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TPixKey,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!BASE_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "PIX key must contain only alphanumeric characters, @, ., +, - or _"));
    }
    const len = value.length;
    const isCpf = len === 11 && DIGITS_ONLY_REGEX.test(value);
    const isCnpj = len === 14 && DIGITS_ONLY_REGEX.test(value);
    const isPhone = /^\+\d{10,15}$/.test(value);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isEvp = EVP_REGEX.test(value);
    if (!isCpf && !isCnpj && !isPhone && !isEmail && !isEvp) {
      return err(ExceptionValidation.create(fieldPath, "PIX key must be a valid CPF (11 digits), CNPJ (14 digits), phone (+XX...), email (contains @), or EVP (32-36 alphanumeric)"));
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TPixKey, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TPixKey>(raw: T, fieldPath = "PixKey"): Result<FPixKey, ExceptionValidation> {
    const typed = FPixKey.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FPixKey(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TPixKey, fieldPath = "PixKey"): FPixKey {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TPixKey>(value: T, fieldPath = "PixKey"): Result<FPixKey, ExceptionValidation> {
    const typed = FPixKey.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FPixKey(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TPixKeyFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "PIX key — accepts CPF (11 digits), CNPJ (14 digits), phone (+XX...), email (contains @), or EVP (32-36 alphanumeric random key).";
  }

  override getShortDescription(): string {
    return "PIX key";
  }
}
