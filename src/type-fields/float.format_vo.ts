import { TypeField, TValidationLevel, TFormatTarget } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TFloat = number;
export type TFloatFormatted = string;

export class FFloat extends TypeField<TFloat, TFloatFormatted> {
  override readonly typeInference = "FFloat";

  override readonly config: ITypeFieldConfig<TFloat> = {
    jsonSchemaType: "number",
    min: Number.MIN_SAFE_INTEGER,
    max: Number.MAX_SAFE_INTEGER,
    decimalPrecision: 10,
    serializeAsString: false,
  };

  private constructor(value: TFloat, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TFloat,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!Number.isFinite(value)) {
      return err(ExceptionValidation.create(fieldPath, "Value must be a finite number"));
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TFloat, ExceptionValidation> {
    return TypeGuard.extractNumber(value, fieldPath);
  }

  static formCreate(raw: unknown, fieldPath = "Float"): Result<FFloat, ExceptionValidation> {
    return FFloat.create(TypeField.normalizeFormInput(raw, "number"), fieldPath);
  }

  static formAssign(raw: unknown, fieldPath = "Float"): Result<FFloat, ExceptionValidation> {
    return FFloat.assign(TypeField.normalizeFormInput(raw, "number"), fieldPath);
  }

  static create<T = TFloat>(raw: T, fieldPath = "Float"): Result<FFloat, ExceptionValidation> {
    const typed = FFloat.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FFloat(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TFloat, fieldPath = "Float"): FFloat {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TFloat>(value: T, fieldPath = "Float"): Result<FFloat, ExceptionValidation> {
    const typed = FFloat.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FFloat(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(target: TFormatTarget = "display"): TFloatFormatted {
    return TypeField.formatNumber(this.getValue(), { maximumFractionDigits: this.config.decimalPrecision }, target);
  }

  override getDescription(): string {
    return "Decimal number with up to 10 decimal places.";
  }

  override getShortDescription(): string {
    return "Float";
  }
}
