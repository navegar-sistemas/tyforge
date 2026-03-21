import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TPageNumber = number;

export class FPageNumber extends TypeField<TPageNumber, string> {
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

  static validateRaw(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const base = TypeGuard.isNumber(value, fieldPath, 1, Number.MAX_SAFE_INTEGER, 0);
    if (!base.success) return base;

    if (!Number.isInteger(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Valor deve ser um número inteiro",
        ),
      );
    }

    if ((value as number) < 1) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Página deve ser maior ou igual a 1",
        ),
      );
    }

    return OK_TRUE;
  }

  static create(
    raw: TPageNumber,
    fieldPath = "PageNumber",
  ): Result<FPageNumber, ExceptionValidation> {
    const validation = FPageNumber.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FPageNumber(raw, fieldPath));
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
    return FPageNumber.validateRaw(value, fieldPath);
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
