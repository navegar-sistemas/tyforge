import {
  TypeField,
  TValidationLevel,
} from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TBankE2eId = string;
export type TBankE2eIdFormatted = string;

const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;

export class FBankE2eId extends TypeField<TBankE2eId, TBankE2eIdFormatted> {
  override readonly typeInference = "FBankE2eId";

  override readonly config: ITypeFieldConfig<TBankE2eId> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 35,
    serializeAsString: false,
  };

  private constructor(value: TBankE2eId, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TBankE2eId,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!ALPHANUMERIC_REGEX.test(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Bank E2E ID must contain only alphanumeric characters",
        ),
      );
    }
    return OK_TRUE;
  }

  static validateType(
    value: unknown,
    fieldPath: string,
  ): Result<TBankE2eId, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TBankE2eId>(
    raw: T,
    fieldPath = "BankE2eId",
  ): Result<FBankE2eId, ExceptionValidation> {
    const typed = FBankE2eId.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBankE2eId(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TBankE2eId, fieldPath = "BankE2eId"): FBankE2eId {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TBankE2eId>(
    value: T,
    fieldPath = "BankE2eId",
  ): Result<FBankE2eId, ExceptionValidation> {
    const typed = FBankE2eId.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBankE2eId(typed.value, fieldPath);
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

  override formatted(): TBankE2eIdFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return (
      "End-to-end identifier for instant payment " +
      "transactions (alphanumeric, up to " +
      "35 characters)."
    );
  }

  override getShortDescription(): string {
    return "Bank E2E ID";
  }
}
