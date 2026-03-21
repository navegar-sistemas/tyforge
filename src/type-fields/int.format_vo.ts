import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TInt = number;

export class FInt extends TypeField<TInt> {
  override readonly typeInference = "FInt";

  override readonly config: ITypeFieldConfig<TInt> = {
    jsonSchemaType: "number",
    min: -2147483648,
    max: 2147483647,
    decimalPrecision: 0,
    serializeAsString: false,
  };

  private constructor(value: TInt, fieldPath: string) {
    super(value, fieldPath);
  }

  static create(
    raw: TInt,
    fieldPath = "Int",
  ): Result<FInt, ExceptionValidation> {
    const inst = new FInt(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
  }

  static createOrThrow(raw: TInt, fieldPath = "Int"): FInt {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TInt,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    // Validação da classe pai
    const baseValidation = super.validate(value, fieldPath);

    if (isFailure(baseValidation)) return baseValidation;

    // Validações customizadas

    const validateInteger: (value: TInt) => boolean = (value) =>
      Number.isInteger(value);
    if (!validateInteger(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Valor deve ser um número inteiro",
        ),
      );
    }

    return ok(true);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Número inteiro sem casas decimais. Campo genérico para armazenar valores numéricos inteiros, utilizado quando não há regras específicas de validação ou limites.";
  }

  override getShortDescription(): string {
    return "Número inteiro";
  }
}
