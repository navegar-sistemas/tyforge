import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TBusinessName = string;
export type TBusinessNameFormatted = string;

export class FBusinessName extends TypeField<TBusinessName, TBusinessNameFormatted> {
  override readonly typeInference = "FBusinessName";

  override readonly config: ITypeFieldConfig<TBusinessName> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 100,
    serializeAsString: false,
  };

  private constructor(value: TBusinessName, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath: string): Result<TBusinessName, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TBusinessName>(raw: T, fieldPath = "BusinessName"): Result<FBusinessName, ExceptionValidation> {
    const typed = FBusinessName.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBusinessName(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TBusinessName, fieldPath = "BusinessName"): FBusinessName {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TBusinessName>(value: T, fieldPath = "BusinessName"): Result<FBusinessName, ExceptionValidation> {
    const typed = FBusinessName.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBusinessName(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TBusinessNameFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Business or trade name (up to 100 characters).";
  }

  override getShortDescription(): string {
    return "Business name";
  }
}
