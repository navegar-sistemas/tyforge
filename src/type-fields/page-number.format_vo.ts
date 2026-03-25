import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TPageNumber = number;
export type TPageNumberFormatted = string;

export class FPageNumber extends TypeField<TPageNumber, TPageNumberFormatted> {
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

  protected override validateRules(
    value: TPageNumber,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!Number.isInteger(value)) {
      return err(
        ExceptionValidation.create(fieldPath, "Valor deve ser um número inteiro"),
      );
    }
    if (value < 1) {
      return err(
        ExceptionValidation.create(fieldPath, "Página deve ser maior ou igual a 1"),
      );
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TPageNumber, ExceptionValidation> {
    return TypeGuard.extractNumber(value, fieldPath);
  }

  static create<T = TPageNumber>(raw: T, fieldPath = "PageNumber"): Result<FPageNumber, ExceptionValidation> {
    const typed = FPageNumber.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const normalized = TypeField.normalize(typed.value, TypeField.createLevel);
    const instance = new FPageNumber(normalized, fieldPath);
    const rules = instance.validateRules(normalized, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TPageNumber, fieldPath = "PageNumber"): FPageNumber {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TPageNumber>(value: T, fieldPath = "PageNumber"): Result<FPageNumber, ExceptionValidation> {
    const typed = FPageNumber.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const normalized = TypeField.normalize(typed.value, TypeField.assignLevel);
    const instance = new FPageNumber(normalized, fieldPath);
    const rules = instance.validateRules(normalized, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
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
