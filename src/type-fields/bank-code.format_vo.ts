import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TBankCode = string;
export type TBankCodeFormatted = string;

const DIGITS_REGEX = /^\d+$/;
const ISPB_REGEX = /^\d{8}$/;

export class FBankCode extends TypeField<TBankCode, TBankCodeFormatted> {
  override readonly typeInference = "FBankCode";

  override readonly config: ITypeFieldConfig<TBankCode> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 20,
    serializeAsString: false,
  };

  private constructor(value: TBankCode, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TBankCode,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!DIGITS_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "Bank code must contain only numeric digits"));
    }
    switch (TypeField.localeRegion) {
      case "us":
        break;
      case "br":
        if (!ISPB_REGEX.test(value)) {
          return err(ExceptionValidation.create(fieldPath, "ISPB bank code must be exactly 8 numeric digits"));
        }
        break;
      default:
        TypeField.assertNeverLocale(TypeField.localeRegion);
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TBankCode, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TBankCode>(raw: T, fieldPath = "BankCode"): Result<FBankCode, ExceptionValidation> {
    const typed = FBankCode.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBankCode(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TBankCode, fieldPath = "BankCode"): FBankCode {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TBankCode>(value: T, fieldPath = "BankCode"): Result<FBankCode, ExceptionValidation> {
    const typed = FBankCode.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBankCode(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TBankCodeFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Bank identification code (numeric). Locale-aware: enforces ISPB 8-digit format when TypeField.localeRegion is 'br'.";
  }

  override getShortDescription(): string {
    return "Bank code";
  }
}
