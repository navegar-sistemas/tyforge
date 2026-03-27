import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TMoney = number;
export type TMoneyFormatted = string;

export class FMoney extends TypeField<TMoney, TMoneyFormatted> {
  override readonly typeInference: string = "FMoney";

  override readonly config: ITypeFieldConfig<TMoney> = {
    jsonSchemaType: "number",
    min: Number.MIN_SAFE_INTEGER,
    max: Number.MAX_SAFE_INTEGER,
    decimalPrecision: 0,
    serializeAsString: false,
  };

  protected constructor(value: TMoney, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TMoney,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!Number.isInteger(value)) {
      return err(
        ExceptionValidation.create(fieldPath, "Value must be an integer (cents)"),
      );
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TMoney, ExceptionValidation> {
    return TypeGuard.extractNumber(value, fieldPath);
  }

  static formCreate(raw: unknown, fieldPath = "Money"): Result<FMoney, ExceptionValidation> {
    return FMoney.create(TypeField.normalizeFormInput(raw, "number"), fieldPath);
  }

  static formAssign(raw: unknown, fieldPath = "Money"): Result<FMoney, ExceptionValidation> {
    return FMoney.assign(TypeField.normalizeFormInput(raw, "number"), fieldPath);
  }

  static create<T = TMoney>(raw: T, fieldPath = "Money"): Result<FMoney, ExceptionValidation> {
    const typed = FMoney.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FMoney(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TMoney, fieldPath = "Money"): FMoney {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TMoney>(value: T, fieldPath = "Money"): Result<FMoney, ExceptionValidation> {
    const typed = FMoney.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FMoney(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  /**
   * Converts a decimal amount (e.g. 10.50) to integer cents and returns an FMoney instance.
   */
  static fromDecimal(value: number, fieldPath = "Money"): Result<FMoney, ExceptionValidation> {
    const cents = Math.round(value * 100);
    return FMoney.create(cents, fieldPath);
  }

  /**
   * Returns an FMoney representing zero cents.
   */
  static zero(fieldPath = "Money"): FMoney {
    return FMoney.createOrThrow(0, fieldPath);
  }

  /**
   * Adds the cents of another FMoney to this one and returns a new FMoney.
   */
  add(other: FMoney): Result<FMoney, ExceptionValidation> {
    return FMoney.create(this.getValue() + other.getValue(), this.fieldPath);
  }

  /**
   * Subtracts the cents of another FMoney from this one and returns a new FMoney.
   */
  subtract(other: FMoney): Result<FMoney, ExceptionValidation> {
    return FMoney.create(this.getValue() - other.getValue(), this.fieldPath);
  }

  /**
   * Returns true if the value is zero cents.
   */
  isZero(): boolean {
    return this.getValue() === 0;
  }

  /**
   * Returns true if the value is greater than zero.
   */
  isPositive(): boolean {
    return this.getValue() > 0;
  }

  /**
   * Returns true if the value is less than zero.
   */
  isNegative(): boolean {
    return this.getValue() < 0;
  }

  /**
   * Returns true if this amount is greater than the other.
   */
  isGreaterThan(other: FMoney): boolean {
    return this.getValue() > other.getValue();
  }

  /**
   * Returns true if this amount is less than the other.
   */
  isLessThan(other: FMoney): boolean {
    return this.getValue() < other.getValue();
  }

  /**
   * Returns true if this amount equals the other.
   */
  isEqualTo(other: FMoney): boolean {
    return this.getValue() === other.getValue();
  }

  /**
   * Converts integer cents to a decimal number (e.g. 1050 -> 10.50).
   */
  toDecimal(): number {
    return this.getValue() / 100;
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TMoneyFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Monetary value stored as integer cents. Avoids floating point precision issues by representing all amounts in the smallest currency unit.";
  }

  override getShortDescription(): string {
    return "Money (cents)";
  }
}
