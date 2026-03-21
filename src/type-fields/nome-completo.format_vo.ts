import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TNomeCompleto = string;

export class FNomeCompleto extends TypeField<TNomeCompleto> {
  override readonly typeInference = "FNomeCompleto";

  override readonly config: ITypeFieldConfig<TNomeCompleto> = {
    jsonSchemaType: "string",
    minLength: 2,
    maxLength: 140,
    serializeAsString: false,
  };

  private constructor(value: TNomeCompleto, fieldPath: string) {
    super(value, fieldPath);
  }

  static create(
    raw: TNomeCompleto,
    fieldPath = "NomeCompleto",
  ): Result<FNomeCompleto, ExceptionValidation> {
    const inst = new FNomeCompleto(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
  }

  static createOrThrow(
    raw: TNomeCompleto,
    fieldPath = "NomeCompleto",
  ): FNomeCompleto {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TNomeCompleto,
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
    return "Nome completo de uma pessoa, incluindo nome e sobrenome. Deve conter pelo menos 2 caracteres e não pode exceder 100 caracteres. Utilizado para identificação pessoal.";
  }

  override getShortDescription(): string {
    return "Nome completo da pessoa";
  }
}
