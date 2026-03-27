import { TypeField } from "@tyforge/type-fields/type-field.base";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { FMoney, TMoney } from "./money.format_vo";

export type TCurrency = number;
export type TCurrencyFormatted = string;

// Decimal convenience layer on top of FMoney (integer cents).
// Accepts decimal input (10.50), converts to cents (1050), stores as FMoney.
// All arithmetic and comparisons are inherited from FMoney (integer-safe).

export class FCurrency extends FMoney {
  override readonly typeInference = "FCurrency";

  private constructor(cents: TMoney, fieldPath: string) {
    super(cents, fieldPath);
  }

  static formCreate(raw: unknown, fieldPath = "Currency"): Result<FCurrency, ExceptionValidation> {
    return FCurrency.create(TypeField.normalizeFormInput(raw, "number"), fieldPath);
  }

  static formAssign(raw: unknown, fieldPath = "Currency"): Result<FCurrency, ExceptionValidation> {
    return FCurrency.assign(TypeField.normalizeFormInput(raw, "number"), fieldPath);
  }

  // Accepts decimal input, converts to integer cents internally.
  static override create<T = TCurrency>(raw: T, fieldPath = "Currency"): Result<FCurrency, ExceptionValidation> {
    const typed = TypeGuard.extractNumber(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const cents = Math.round(typed.value * 100);
    const instance = new FCurrency(cents, fieldPath);
    const rules = instance.validateRules(cents, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static override createOrThrow(raw: TCurrency, fieldPath = "Currency"): FCurrency {
    const result = FCurrency.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  /**
   * Assign from persisted integer cents (NOT decimal).
   * Use create() for decimal input.
   * @example FCurrency.create(10.50)  // decimal -> 1050 cents
   * @example FCurrency.assign(1050)   // cents from DB -> 1050 cents
   */
  static override assign<T = TMoney>(value: T, fieldPath = "Currency"): Result<FCurrency, ExceptionValidation> {
    const typed = TypeGuard.extractNumber(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FCurrency(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static override zero(fieldPath = "Currency"): FCurrency {
    return new FCurrency(0, fieldPath);
  }

  // Returns the decimal representation (e.g., 1050 cents -> 10.50).
  toDecimalValue(): number {
    return this.getValue() / 100;
  }

  override formatted(): TCurrencyFormatted {
    return this.toDecimalValue().toFixed(2);
  }

  override toString(): string {
    return this.toDecimalValue().toFixed(2);
  }

  override getDescription(): string {
    return "Decimal currency input that stores as integer cents internally. Accepts decimal values (10.50), converts to cents (1050). Inherits arithmetic and comparisons from FMoney.";
  }

  override getShortDescription(): string {
    return "Currency";
  }
}
