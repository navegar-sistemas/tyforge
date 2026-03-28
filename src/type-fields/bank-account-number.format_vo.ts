import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TBankAccountNumber = string;
export type TBankAccountNumberFormatted = string;

const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;
const ACCOUNT_BR_REGEX = /^\d{1,13}(-\d)?$/;

export class FBankAccountNumber extends TypeField<TBankAccountNumber, TBankAccountNumberFormatted> {
  override readonly typeInference = "FBankAccountNumber";

  override readonly config: ITypeFieldConfig<TBankAccountNumber> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 34,
    serializeAsString: false,
  };

  private constructor(value: TBankAccountNumber, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TBankAccountNumber,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!ALPHANUMERIC_REGEX.test(value.replace(/-/g, ""))) {
      return err(ExceptionValidation.create(fieldPath, "Bank account number must contain only alphanumeric characters"));
    }
    switch (TypeField.localeRegion) {
      case "us":
        break;
      case "br":
        if (!ACCOUNT_BR_REGEX.test(value)) {
          return err(ExceptionValidation.create(fieldPath, "Brazilian bank account must be 1-13 numeric digits, optionally followed by -D (check digit)"));
        }
        break;
      default:
        TypeField.assertNeverLocale(TypeField.localeRegion);
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TBankAccountNumber, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TBankAccountNumber>(raw: T, fieldPath = "BankAccountNumber"): Result<FBankAccountNumber, ExceptionValidation> {
    const typed = FBankAccountNumber.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBankAccountNumber(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TBankAccountNumber, fieldPath = "BankAccountNumber"): FBankAccountNumber {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TBankAccountNumber>(value: T, fieldPath = "BankAccountNumber"): Result<FBankAccountNumber, ExceptionValidation> {
    const typed = FBankAccountNumber.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBankAccountNumber(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TBankAccountNumberFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Bank account number (alphanumeric, up to 34 characters). Locale-aware: enforces Brazilian format (1-13 digits + check digit) when TypeField.localeRegion is 'br'.";
  }

  override getShortDescription(): string {
    return "Bank account number";
  }
}
