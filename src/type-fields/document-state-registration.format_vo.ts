import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TDocumentStateRegistration = string;
export type TDocumentStateRegistrationFormatted = string;

export class FDocumentStateRegistration extends TypeField<TDocumentStateRegistration, TDocumentStateRegistrationFormatted> {
  private static readonly NUMERIC_REGEX = /^\d+$/;
  override readonly typeInference = "FDocumentStateRegistration";

  override readonly config: ITypeFieldConfig<TDocumentStateRegistration> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 20,
    serializeAsString: false,
  };

  private constructor(value: TDocumentStateRegistration, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TDocumentStateRegistration,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!FDocumentStateRegistration.NUMERIC_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "State registration must contain only numeric characters"));
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TDocumentStateRegistration, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TDocumentStateRegistration>(raw: T, fieldPath = "StateRegistration"): Result<FDocumentStateRegistration, ExceptionValidation> {
    const typed = FDocumentStateRegistration.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentStateRegistration(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TDocumentStateRegistration, fieldPath = "StateRegistration"): FDocumentStateRegistration {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDocumentStateRegistration>(value: T, fieldPath = "StateRegistration"): Result<FDocumentStateRegistration, ExceptionValidation> {
    const typed = FDocumentStateRegistration.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentStateRegistration(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TDocumentStateRegistrationFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "State tax registration number (numeric, variable length).";
  }

  override getShortDescription(): string {
    return "State registration";
  }
}
