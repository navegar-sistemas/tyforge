import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TTotpSecret = string;
export type TTotpSecretFormatted = string;

export class FTotpSecret extends TypeField<TTotpSecret, TTotpSecretFormatted> {
  private static readonly BASE32_REGEX = /^[A-Z2-7]+={0,6}$/;
  override readonly typeInference = "FTotpSecret";

  override readonly config: ITypeFieldConfig<TTotpSecret> = {
    jsonSchemaType: "string",
    minLength: 16,
    maxLength: 128,
    serializeAsString: false,
  };

  private constructor(value: TTotpSecret, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TTotpSecret,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!FTotpSecret.BASE32_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "TOTP secret must be a valid base32-encoded string"));
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TTotpSecret, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TTotpSecret>(raw: T, fieldPath = "TotpSecret"): Result<FTotpSecret, ExceptionValidation> {
    const typed = FTotpSecret.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FTotpSecret(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TTotpSecret, fieldPath = "TotpSecret"): FTotpSecret {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TTotpSecret>(value: T, fieldPath = "TotpSecret"): Result<FTotpSecret, ExceptionValidation> {
    const typed = FTotpSecret.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FTotpSecret(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TTotpSecretFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "TOTP shared secret encoded in base32 for two-factor authentication.";
  }

  override getShortDescription(): string {
    return "TOTP secret";
  }
}
