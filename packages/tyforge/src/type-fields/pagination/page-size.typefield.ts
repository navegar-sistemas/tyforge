import { TypeField, TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
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

  protected override validateRules(
    value: TPageSize,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!Number.isInteger(value)) {
      return err(
        ExceptionValidation.create(fieldPath, "Value must be an integer"),
      );
    }
    if (value < 1) {
      return err(
        ExceptionValidation.create(fieldPath, "Page size must be greater than 0"),
      );
    }
    if (value > 100) {
      return err(
        ExceptionValidation.create(fieldPath, "Page size must not exceed 100"),
      );
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TPageSize, ExceptionValidation> {
    return TypeGuard.extractNumber(value, fieldPath);
  }

  static formCreate(raw: unknown, fieldPath = "PageSize"): Result<FPageSize, ExceptionValidation> {
    return FPageSize.create(TypeField.normalizeFormInput(raw, "number"), fieldPath);
  }

  static formAssign(raw: unknown, fieldPath = "PageSize"): Result<FPageSize, ExceptionValidation> {
    return FPageSize.assign(TypeField.normalizeFormInput(raw, "number"), fieldPath);
  }

  static create<T = TPageSize>(raw: T, fieldPath = "PageSize"): Result<FPageSize, ExceptionValidation> {
    const typed = FPageSize.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FPageSize(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TPageSize, fieldPath = "PageSize"): FPageSize {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TPageSize>(value: T, fieldPath = "PageSize"): Result<FPageSize, ExceptionValidation> {
    const typed = FPageSize.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FPageSize(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TPageSizeFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Tamanho da página para paginação. Deve ser um inteiro entre 1 e 100.";
  }

  override getShortDescription(): string {
    return "Tamanho da página";
  }
}
