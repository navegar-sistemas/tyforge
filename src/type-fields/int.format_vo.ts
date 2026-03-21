import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TInt = number;

export class FInt extends TypeField<TInt, string> {
  override readonly typeInference = "FInt";

  override readonly config: ITypeFieldConfig<TInt> = {
    jsonSchemaType: "number",
    min: -2147483648,
    max: 2147483647,
    decimalPrecision: 0,
    serializeAsString: false,
  };

  private constructor(value: TInt, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateRaw(value: unknown, fieldPath: string): Result<true, ExceptionValidation> {
    const base = TypeGuard.isNumber(value, fieldPath, -2147483648, 2147483647, 0);
    if (!base.success) return base;
    if (!Number.isInteger(value)) {
      return err(
        ExceptionValidation.create(fieldPath, "Valor deve ser um número inteiro"),
      );
    }
    return OK_TRUE;
  }

  static create(
    raw: TInt,
    fieldPath = "Int",
  ): Result<FInt, ExceptionValidation> {
    const validation = FInt.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FInt(raw, fieldPath));
  }

  static createOrThrow(raw: TInt, fieldPath = "Int"): FInt {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TInt,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FInt.validateRaw(value, fieldPath);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Número inteiro sem casas decimais. Campo genérico para armazenar valores numéricos inteiros, utilizado quando não há regras específicas de validação ou limites.";
  }

  override getShortDescription(): string {
    return "Número inteiro";
  }
}
