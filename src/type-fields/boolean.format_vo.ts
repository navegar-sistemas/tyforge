import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE, OK_FALSE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

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

  static validateRaw(value: unknown, fieldPath: string): Result<boolean, ExceptionValidation> {
    if (typeof value === "boolean") {
      return ok(value);
    }
    if (typeof value === "string") {
      const lowerValue = value.toLowerCase();
      if (lowerValue === "true" || lowerValue === "1" || lowerValue === "yes") {
        return OK_TRUE;
      }
      if (lowerValue === "false" || lowerValue === "0" || lowerValue === "no") {
        return OK_FALSE;
      }
    }
    if (typeof value === "number") {
      if (value === 1) return OK_TRUE;
      if (value === 0) return OK_FALSE;
    }
    return err(
      ExceptionValidation.create(fieldPath, "Valor deve ser um booleano válido"),
    );
  }

  static create(
    raw: TBoolean | number | string,
    fieldPath = "Boolean",
  ): Result<FBoolean, ExceptionValidation> {
    const validation = FBoolean.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FBoolean(validation.value, fieldPath));
  }

  static createOrThrow(
    raw: TBoolean | number | string,
    fieldPath = "Boolean",
  ): FBoolean {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TBoolean,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const coerced = FBoolean.validateRaw(value, fieldPath);
    if (!coerced.success) return err(coerced.error);
    return OK_TRUE;
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
