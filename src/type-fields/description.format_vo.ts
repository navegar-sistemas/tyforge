import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
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

  static validateRaw(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const base = TypeGuard.isString(value, fieldPath, 1, 1000);
    if (!base.success) return base;
    return OK_TRUE;
  }

  static create(
    raw: TDescription,
    fieldPath = "Description",
  ): Result<FDescription, ExceptionValidation> {
    const validation = FDescription.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FDescription(raw, fieldPath));
  }

  static createOrThrow(raw: TDescription, fieldPath = "Description"): FDescription {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TDescription,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FDescription.validateRaw(value, fieldPath);
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
