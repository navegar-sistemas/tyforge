import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TString = string;

export class FString extends TypeField<TString> {
  override readonly typeInference = "FString";

  override readonly config: ITypeFieldConfig<TString> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 255,
    serializeAsString: false,
  };

  private constructor(value: TString, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateRaw(value: unknown, fieldPath: string): Result<true, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath, 1, 255);
  }

  static create(
    raw: TString,
    fieldPath = "String",
  ): Result<FString, ExceptionValidation> {
    const validation = FString.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FString(raw, fieldPath));
  }

  static createOrThrow(raw: TString, fieldPath = "String"): FString {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TString,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FString.validateRaw(value, fieldPath);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Texto simples sem formatação específica.";
  }

  override getShortDescription(): string {
    return "Texto simples";
  }
}
