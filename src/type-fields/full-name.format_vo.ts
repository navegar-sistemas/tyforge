import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TFullName = string;
export type TFullNameFormatted = string;

export class FFullName extends TypeField<TFullName, TFullNameFormatted> {
  override readonly typeInference = "FFullName";

  override readonly config: ITypeFieldConfig<TFullName> = {
    jsonSchemaType: "string",
    minLength: 2,
    maxLength: 140,
    serializeAsString: false,
  };

  private constructor(value: TFullName, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath: string): Result<TFullName, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TFullName>(raw: T, fieldPath = "FullName"): Result<FFullName, ExceptionValidation> {
    const typed = FFullName.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const normalized = TypeField.normalize(typed.value, TypeField.createLevel);
    const instance = new FFullName(normalized, fieldPath);
    const rules = instance.validateRules(normalized, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TFullName, fieldPath = "FullName"): FFullName {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TFullName>(value: T, fieldPath = "FullName"): Result<FFullName, ExceptionValidation> {
    const typed = FFullName.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const normalized = TypeField.normalize(typed.value, TypeField.assignLevel);
    const instance = new FFullName(normalized, fieldPath);
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
    return "Nome completo de uma pessoa, incluindo nome e sobrenome. Deve conter pelo menos 2 caracteres e não pode exceder 100 caracteres. Utilizado para identificação pessoal.";
  }

  override getShortDescription(): string {
    return "Nome completo da pessoa";
  }
}
