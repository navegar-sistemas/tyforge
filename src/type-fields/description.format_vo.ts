import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TDescription = string;
export type TDescriptionFormatted = string;

export class FDescription extends TypeField<TDescription, TDescriptionFormatted> {
  override readonly typeInference = "FDescription";

  override readonly config: ITypeFieldConfig<TDescription> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 1000,
    serializeAsString: false,
  };

  private constructor(value: TDescription, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath: string): Result<TDescription, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TDescription>(raw: T, fieldPath = "Description"): Result<FDescription, ExceptionValidation> {
    const typed = FDescription.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDescription(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TDescription, fieldPath = "Description"): FDescription {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDescription>(value: T, fieldPath = "Description"): Result<FDescription, ExceptionValidation> {
    const typed = FDescription.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDescription(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Descrição detalhada. Deve fornecer informações suficientes para compreensão completa do objeto descrito.";
  }

  override getShortDescription(): string {
    return "Descrição detalhada";
  }
}
