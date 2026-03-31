import {
  TypeField,
  TValidationLevel,
} from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TBankBranch = string;
export type TBankBranchFormatted = string;

const DIGITS_REGEX = /^\d+$/;
const BRANCH_BR_REGEX = /^\d{4}$/;

export class FBankBranch extends TypeField<TBankBranch, TBankBranchFormatted> {
  override readonly typeInference = "FBankBranch";

  override readonly config: ITypeFieldConfig<TBankBranch> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 20,
    serializeAsString: false,
  };

  private constructor(value: TBankBranch, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TBankBranch,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!DIGITS_REGEX.test(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Bank branch must contain only numeric digits",
        ),
      );
    }
    switch (TypeField.localeRegion) {
      case "us":
        break;
      case "br":
        if (!BRANCH_BR_REGEX.test(value)) {
          return err(
            ExceptionValidation.create(
              fieldPath,
              "Brazilian bank branch must be exactly 4 numeric digits",
            ),
          );
        }
        break;
      default:
        TypeField.assertNeverLocale(TypeField.localeRegion);
    }
    return OK_TRUE;
  }

  static validateType(
    value: unknown,
    fieldPath: string,
  ): Result<TBankBranch, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TBankBranch>(
    raw: T,
    fieldPath = "BankBranch",
  ): Result<FBankBranch, ExceptionValidation> {
    const typed = FBankBranch.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBankBranch(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(
    raw: TBankBranch,
    fieldPath = "BankBranch",
  ): FBankBranch {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TBankBranch>(
    value: T,
    fieldPath = "BankBranch",
  ): Result<FBankBranch, ExceptionValidation> {
    const typed = FBankBranch.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBankBranch(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.assignLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TBankBranchFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return (
      "Bank branch number (numeric). " +
      "Locale-aware: enforces 4-digit format " +
      "when TypeField.localeRegion is 'br'."
    );
  }

  override getShortDescription(): string {
    return "Bank branch";
  }
}
