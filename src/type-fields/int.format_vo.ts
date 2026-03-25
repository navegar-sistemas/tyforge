import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TInt = number;
export type TIntFormatted = string;

export class FInt extends TypeField<TInt, TIntFormatted> {
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

  protected override validateRules(
    value: TInt,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!Number.isInteger(value)) {
      return err(
        ExceptionValidation.create(fieldPath, "Valor deve ser um número inteiro"),
      );
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TInt, ExceptionValidation> {
    return TypeGuard.extractNumber(value, fieldPath);
  }

  static create<T = TInt>(raw: T, fieldPath = "Int"): Result<FInt, ExceptionValidation> {
    const typed = FInt.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FInt(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TInt, fieldPath = "Int"): FInt {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TInt>(value: T, fieldPath = "Int"): Result<FInt, ExceptionValidation> {
    const typed = FInt.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FInt(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
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
    return "Número inteiro sem casas decimais. Campo genérico para armazenar valores numéricos inteiros, utilizado quando não há regras específicas de validação ou limites.";
  }

  override getShortDescription(): string {
    return "Número inteiro";
  }
}
