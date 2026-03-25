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

  static create<T = TBoolean>(raw: T, fieldPath = "Boolean"): Result<FBoolean, ExceptionValidation> {
    const bool = TypeGuard.extractBoolean(raw, fieldPath);
    if (isFailure(bool)) return err(bool.error);
    const value = TypeField.normalize(bool.value, TypeField.createLevel);
    const instance = new FBoolean(value, fieldPath);
    const validation = instance.validate(value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: TBoolean, fieldPath = "Boolean"): FBoolean {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TBoolean>(value: T, fieldPath = "Boolean"): Result<FBoolean, ExceptionValidation> {
    const bool = TypeGuard.extractBoolean(value, fieldPath);
    if (isFailure(bool)) return err(bool.error);
    const normalized = TypeField.normalize(bool.value, TypeField.assignLevel);
    const instance = new FBoolean(normalized, fieldPath);
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
    return "Valor booleano verdadeiro ou falso. Representa um estado lógico que pode ser verdadeiro (true) ou falso (false). Utilizado para flags, status simples e condições lógicas no sistema.";
  }

  override getShortDescription(): string {
    return "Valor booleano (true/false)";
  }
}
