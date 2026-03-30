import { TypeField, TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const OSortOrder = { ASC: "asc", DESC: "desc" } as const;
export type TSortOrder = typeof OSortOrder[keyof typeof OSortOrder];
export type TSortOrderFormatted = string;

export class FSortOrder extends TypeField<TSortOrder, TSortOrderFormatted> {
  override readonly typeInference = "FSortOrder";

  override readonly config: ITypeFieldConfig<TSortOrder> = {
    jsonSchemaType: "string",
    serializeAsString: false,
    minLength: 3,
    maxLength: 4,
    validateEnum: OSortOrder,
  };

  private constructor(value: TSortOrder, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TSortOrder,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    const valid = Object.values(OSortOrder);
    if (!valid.includes(value)) {
      return err(ExceptionValidation.create(fieldPath, `Sort order must be one of: ${valid.join(", ")}`));
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath = "SortOrder"): Result<TSortOrder, ExceptionValidation> {
    const result = TypeGuard.isString(value, fieldPath, 3, 4);
    if (!result.success) return result;
    if (result.value === OSortOrder.ASC) return ok(OSortOrder.ASC);
    if (result.value === OSortOrder.DESC) return ok(OSortOrder.DESC);
    return err(ExceptionValidation.create(fieldPath, `Sort order must be one of: ${Object.values(OSortOrder).join(", ")}`));
  }

  static create<T = TSortOrder>(raw: T, fieldPath = "SortOrder"): Result<FSortOrder, ExceptionValidation> {
    const typed = FSortOrder.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FSortOrder(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(value: TSortOrder, fieldPath = "SortOrder"): FSortOrder {
    const result = FSortOrder.create(value, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TSortOrder>(value: T, fieldPath = "SortOrder"): Result<FSortOrder, ExceptionValidation> {
    const typed = FSortOrder.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FSortOrder(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override formatted(): TSortOrderFormatted { return this.getValue(); }
  override toString(): string { return this.getValue(); }
  override getDescription(): string { return "Sort direction for pagination results. Values: asc, desc."; }
  override getShortDescription(): string { return "Sort order"; }
}
