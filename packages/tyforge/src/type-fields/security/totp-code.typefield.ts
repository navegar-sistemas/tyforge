import { TypeField, TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TTotpCode = string;
export type TTotpCodeFormatted = string;

export class FTotpCode extends TypeField<TTotpCode, TTotpCodeFormatted> {
  private static readonly TOTP_REGEX = /^\d{6}$/;
  override readonly typeInference = "FTotpCode";

  override readonly config: ITypeFieldConfig<TTotpCode> = {
    jsonSchemaType: "string",
    minLength: 6,
    maxLength: 6,
    serializeAsString: false,
  };

  private constructor(value: TTotpCode, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TTotpCode,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!FTotpCode.TOTP_REGEX.test(this.getValue())) {
      return err(ExceptionValidation.create(fieldPath, "TOTP code must contain exactly 6 numeric digits"));
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TTotpCode, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TTotpCode>(raw: T, fieldPath = "TotpCode"): Result<FTotpCode, ExceptionValidation> {
    const typed = FTotpCode.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FTotpCode(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TTotpCode, fieldPath = "TotpCode"): FTotpCode {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TTotpCode>(value: T, fieldPath = "TotpCode"): Result<FTotpCode, ExceptionValidation> {
    const typed = FTotpCode.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FTotpCode(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TTotpCodeFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Time-based One-Time Password code (6 numeric digits) for two-factor authentication";
  }

  override getShortDescription(): string {
    return "TOTP code";
  }
}
