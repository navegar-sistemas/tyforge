import { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { FIdentifier, TIdentifier } from "../identity/identifier.typefield";

export type TBankNsu = TIdentifier;
export type TBankNsuFormatted = string;

const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;

export class FBankNsu extends FIdentifier {
  override readonly typeInference = "FBankNsu";

  override readonly config: ITypeFieldConfig<TBankNsu> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 20,
    serializeAsString: false,
  };

  private constructor(value: TBankNsu, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TBankNsu,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!ALPHANUMERIC_REGEX.test(this.getValue())) {
      return err(ExceptionValidation.create(fieldPath, "Bank NSU must contain only alphanumeric characters"));
    }
    return OK_TRUE;
  }


  static create<T = TBankNsu>(raw: T, fieldPath = "BankNsu"): Result<FBankNsu, ExceptionValidation> {
    const typed = FIdentifier.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBankNsu(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TBankNsu, fieldPath = "BankNsu"): FBankNsu {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TBankNsu>(value: T, fieldPath = "BankNsu"): Result<FBankNsu, ExceptionValidation> {
    const typed = FIdentifier.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBankNsu(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TBankNsuFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Bank NSU (Unique Sequential Number) — alphanumeric receipt or transaction identifier issued by the payment processor.";
  }

  override getShortDescription(): string {
    return "Bank NSU";
  }
}
