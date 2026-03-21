import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TPageSize = number;

export class FPageSize extends TypeField<TPageSize> {
  override readonly typeInference = "FPageSize";

  override readonly config: ITypeFieldConfig<TPageSize> = {
    jsonSchemaType: "number",
    min: 1,
    max: 100,
    decimalPrecision: 0,
    serializeAsString: false,
  };

  private constructor(value: TPageSize, fieldPath: string) {
    super(value, fieldPath);
  }

  static create(
    raw: TPageSize,
    fieldPath = "PageSize",
  ): Result<FPageSize, ExceptionValidation> {
    const inst = new FPageSize(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
  }

  static createOrThrow(raw: TPageSize, fieldPath = "PageSize"): FPageSize {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TPageSize,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    // Validação da classe pai
    const baseValidation = super.validate(value, fieldPath);

    if (isFailure(baseValidation)) return baseValidation;

    // Validações customizadas

    const validateInteger: (value: TPageSize) => boolean = (value) =>
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
          "Tamanho da página deve ser maior que 0",
        ),
      );
    }

    if (value > 100) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Tamanho da página não pode exceder 100",
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
    return "Tamanho da página para paginação. Deve ser um inteiro entre 1 e 100.";
  }

  override getShortDescription(): string {
    return "Tamanho da página";
  }
}
