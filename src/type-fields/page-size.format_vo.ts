import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TPageSize = number;
export type TPageSizeFormatted = string;

export class FPageSize extends TypeField<TPageSize, TPageSizeFormatted> {
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

  static validateRaw(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const base = TypeGuard.isNumber(value, fieldPath, 1, 100, 0);
    if (!base.success) return base;

    if (!Number.isInteger(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Valor deve ser um número inteiro",
        ),
      );
    }

    if (typeof value !== "number") return base;
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

    return OK_TRUE;
  }

  static create(
    raw: TPageSize,
    fieldPath = "PageSize",
  ): Result<FPageSize, ExceptionValidation> {
    const validation = FPageSize.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FPageSize(raw, fieldPath));
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
    return FPageSize.validateRaw(value, fieldPath);
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
