import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

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

  static validateRaw(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath, 2, 140);
  }

  static create(
    raw: TNomeCompleto,
    fieldPath = "NomeCompleto",
  ): Result<FNomeCompleto, ExceptionValidation> {
    const validation = FNomeCompleto.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FNomeCompleto(raw, fieldPath));
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
    return FNomeCompleto.validateRaw(value, fieldPath);
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
