import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

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

  static create(
    raw: TString,
    fieldPath = "String",
  ): Result<FString, ExceptionValidation> {
    const inst = new FString(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
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
    // Validação da classe pai
    const baseValidation = super.validate(value, fieldPath);

    if (isFailure(baseValidation)) return baseValidation;

    return ok(true);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Texto simples sem formatação específica. Campo genérico para armazenar qualquer tipo de string, utilizado quando não há regras específicas de validação ou formatação.";
  }

  override getShortDescription(): string {
    return "Texto simples";
  }
}
