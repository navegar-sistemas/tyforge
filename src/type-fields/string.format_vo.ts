import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TString = string;
export type TStringFormatted = string;

export class FString extends TypeField<TString, TStringFormatted> {
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

  static create<T = TString>(raw: T, fieldPath = "String"): Result<FString, ExceptionValidation> {
    const str = TypeGuard.isString(raw, fieldPath);
    if (isFailure(str)) return err(str.error);
    const value = TypeField.normalize(str.value, TypeField.createLevel);
    const instance = new FString(value, fieldPath);
    const validation = instance.validate(value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: TString, fieldPath = "String"): FString {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TString>(value: T, fieldPath = "String"): Result<FString, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    const normalized = TypeField.normalize(str.value, TypeField.assignLevel);
    const instance = new FString(normalized, fieldPath);
    const validation = instance.validate(normalized, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
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
