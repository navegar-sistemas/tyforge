import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
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

  static validateType(
    value: unknown,
    fieldPath: string,
  ): Result<TBoolean, ExceptionValidation> {
    return TypeGuard.extractBoolean(value, fieldPath);
  }

  static formCreate(
    raw: unknown,
    fieldPath = "Boolean",
  ): Result<FBoolean, ExceptionValidation> {
    return FBoolean.create(
      TypeField.normalizeFormInput(raw, "boolean"),
      fieldPath,
    );
  }

  static formAssign(
    raw: unknown,
    fieldPath = "Boolean",
  ): Result<FBoolean, ExceptionValidation> {
    return FBoolean.assign(
      TypeField.normalizeFormInput(raw, "boolean"),
      fieldPath,
    );
  }

  static create<T = TBoolean>(
    raw: T,
    fieldPath = "Boolean",
  ): Result<FBoolean, ExceptionValidation> {
    const typed = FBoolean.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBoolean(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TBoolean, fieldPath = "Boolean"): FBoolean {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TBoolean>(
    value: T,
    fieldPath = "Boolean",
  ): Result<FBoolean, ExceptionValidation> {
    const typed = FBoolean.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBoolean(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.assignLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TBooleanFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return (
      "Valor booleano verdadeiro ou falso." +
      " Representa um estado lógico que pode" +
      " ser verdadeiro (true) ou falso (false)." +
      " Utilizado para flags, status simples" +
      " e condições lógicas no sistema."
    );
  }

  override getShortDescription(): string {
    return "Valor booleano (true/false)";
  }
}
