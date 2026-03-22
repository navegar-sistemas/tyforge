import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TText = string;
export type TTextFormatted = string;

export class FText extends TypeField<TText, TTextFormatted> {
  override readonly typeInference = "FText";

  override readonly config: ITypeFieldConfig<TText> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 4000,
    serializeAsString: false,
  };

  private constructor(value: TText, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateRaw(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const base = TypeGuard.isString(value, fieldPath, 1, 4000);
    if (!base.success) return base;
    return OK_TRUE;
  }

  static create(
    raw: TText,
    fieldPath = "Text",
  ): Result<FText, ExceptionValidation> {
    const validation = FText.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FText(raw, fieldPath));
  }

  static createOrThrow(raw: TText, fieldPath = "Text"): FText {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TText,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FText.validateRaw(value, fieldPath);
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
