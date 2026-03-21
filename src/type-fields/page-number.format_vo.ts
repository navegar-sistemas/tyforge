import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TPageNumber = number;

export class FPageNumber extends TypeField<TPageNumber> {
  override readonly typeInference = "FPageNumber";

  override readonly config: ITypeFieldConfig<TPageNumber> = {
    jsonSchemaType: "number",
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
    decimalPrecision: 0,
    serializeAsString: false,
  };

  private constructor(value: TPageNumber, fieldPath: string) {
    super(value, fieldPath);
  }

  static create(
    raw: TPageNumber,
    fieldPath = "PageNumber",
  ): Result<FPageNumber, ExceptionValidation> {
    const inst = new FPageNumber(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
  }

  static createOrThrow(
    raw: TPageNumber,
    fieldPath = "PageNumber",
  ): FPageNumber {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TPageNumber,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    // Validação da classe pai
    const baseValidation = super.validate(value, fieldPath);

    if (isFailure(baseValidation)) return baseValidation;

    // Validações customizadas

    const validateInteger: (value: TPageNumber) => boolean = (value) =>
      Number.isInteger(value);
    if (!validateInteger(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Valor deve ser um número inteiro",
        ),
      );
    }

    if (value < 1) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Página deve ser maior ou igual a 1",
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
    return "Número de página para paginação. Deve ser um inteiro >= 1.";
  }

  override getShortDescription(): string {
    return "Número de página";
  }
}
