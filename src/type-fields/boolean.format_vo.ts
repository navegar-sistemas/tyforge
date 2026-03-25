import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TBoolean = boolean;
export type TBooleanFormatted = string;

export class FBoolean extends TypeField<TBoolean, TBooleanFormatted> {
  override readonly typeInference = "FBoolean";

  override readonly config: ITypeFieldConfig<TBoolean> = {
    jsonSchemaType: "boolean",
    serializeAsString: false,
  };

  private constructor(value: TBoolean, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath: string): Result<TBoolean, ExceptionValidation> {
    return TypeGuard.extractBoolean(value, fieldPath);
  }

  static create<T = TBoolean>(raw: T, fieldPath = "Boolean"): Result<FBoolean, ExceptionValidation> {
    const typed = FBoolean.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const normalized = TypeField.normalize(typed.value, TypeField.createLevel);
    const instance = new FBoolean(normalized, fieldPath);
    const rules = instance.validateRules(normalized, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TBoolean, fieldPath = "Boolean"): FBoolean {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TBoolean>(value: T, fieldPath = "Boolean"): Result<FBoolean, ExceptionValidation> {
    const typed = FBoolean.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const normalized = TypeField.normalize(typed.value, TypeField.assignLevel);
    const instance = new FBoolean(normalized, fieldPath);
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
    return "Valor booleano verdadeiro ou falso. Representa um estado lógico que pode ser verdadeiro (true) ou falso (false). Utilizado para flags, status simples e condições lógicas no sistema.";
  }

  override getShortDescription(): string {
    return "Valor booleano (true/false)";
  }
}
