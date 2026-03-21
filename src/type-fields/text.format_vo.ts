import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TText = string;

export class FText extends TypeField<TText> {
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

  static create(
    raw: TText,
    fieldPath = "Text",
  ): Result<FText, ExceptionValidation> {
    const inst = new FText(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
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
