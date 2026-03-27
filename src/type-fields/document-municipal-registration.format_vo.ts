import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TDocumentMunicipalRegistration = string;
export type TDocumentMunicipalRegistrationFormatted = string;

export class FDocumentMunicipalRegistration extends TypeField<TDocumentMunicipalRegistration, TDocumentMunicipalRegistrationFormatted> {
  private static readonly NUMERIC_REGEX = /^\d+$/;
  override readonly typeInference = "FDocumentMunicipalRegistration";

  override readonly config: ITypeFieldConfig<TDocumentMunicipalRegistration> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 20,
    serializeAsString: false,
  };

  private constructor(value: TDocumentMunicipalRegistration, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TDocumentMunicipalRegistration,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!FDocumentMunicipalRegistration.NUMERIC_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "Municipal registration must contain only numeric characters"));
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TDocumentMunicipalRegistration, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TDocumentMunicipalRegistration>(raw: T, fieldPath = "MunicipalRegistration"): Result<FDocumentMunicipalRegistration, ExceptionValidation> {
    const typed = FDocumentMunicipalRegistration.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentMunicipalRegistration(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TDocumentMunicipalRegistration, fieldPath = "MunicipalRegistration"): FDocumentMunicipalRegistration {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDocumentMunicipalRegistration>(value: T, fieldPath = "MunicipalRegistration"): Result<FDocumentMunicipalRegistration, ExceptionValidation> {
    const typed = FDocumentMunicipalRegistration.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentMunicipalRegistration(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TDocumentMunicipalRegistrationFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Municipal tax registration number (numeric, variable length).";
  }

  override getShortDescription(): string {
    return "Municipal registration";
  }
}
