import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TStateCode = string;
export type TStateCodeFormatted = string;

const STATE_CODE_REGEX = /^[A-Z]{2}$/;

const VALID_STATES_BR = new Set([
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO",
  "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR",
  "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
]);

export class FStateCode extends TypeField<TStateCode, TStateCodeFormatted> {
  override readonly typeInference = "FStateCode";

  override readonly config: ITypeFieldConfig<TStateCode> = {
    jsonSchemaType: "string",
    minLength: 2,
    maxLength: 2,
    serializeAsString: false,
  };

  private constructor(value: TStateCode, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TStateCode,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!STATE_CODE_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "State code must contain exactly 2 uppercase letters"));
    }
    if (TypeField.locale === "br" && !VALID_STATES_BR.has(value)) {
      return err(ExceptionValidation.create(fieldPath, "Invalid Brazilian state code"));
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TStateCode, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TStateCode>(raw: T, fieldPath = "StateCode"): Result<FStateCode, ExceptionValidation> {
    const typed = FStateCode.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FStateCode(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TStateCode, fieldPath = "StateCode"): FStateCode {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TStateCode>(value: T, fieldPath = "StateCode"): Result<FStateCode, ExceptionValidation> {
    const typed = FStateCode.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FStateCode(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TStateCodeFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "State or province code (2 uppercase letters). Locale-aware: validates against known state codes when TypeField.locale is set.";
  }

  override getShortDescription(): string {
    return "State code";
  }
}
