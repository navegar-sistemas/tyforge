import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
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

  protected override validate(
    value: TPageSize,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validate(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!Number.isInteger(value)) {
      return err(
        ExceptionValidation.create(fieldPath, "Valor deve ser um número inteiro"),
      );
    }
    if (value < 1) {
      return err(
        ExceptionValidation.create(fieldPath, "Tamanho da página deve ser maior que 0"),
      );
    }
    if (value > 100) {
      return err(
        ExceptionValidation.create(fieldPath, "Tamanho da página não pode exceder 100"),
      );
    }
    return OK_TRUE;
  }

  static create<T = TPageSize>(raw: T, fieldPath = "PageSize"): Result<FPageSize, ExceptionValidation> {
    const num = TypeGuard.extractNumber(raw, fieldPath);
    if (isFailure(num)) return err(num.error);
    const value = TypeField.normalize(num.value, TypeField.createLevel);
    const instance = new FPageSize(value, fieldPath);
    const validation = instance.validate(value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: TPageSize, fieldPath = "PageSize"): FPageSize {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TPageSize>(value: T, fieldPath = "PageSize"): Result<FPageSize, ExceptionValidation> {
    const num = TypeGuard.extractNumber(value, fieldPath);
    if (isFailure(num)) return err(num.error);
    const normalized = TypeField.normalize(num.value, TypeField.assignLevel);
    const instance = new FPageSize(normalized, fieldPath);
    const validation = instance.validate(normalized, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
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
