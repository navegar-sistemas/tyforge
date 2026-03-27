import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TDocumentCnpj = string;
export type TDocumentCnpjFormatted = string;

export class FDocumentCnpj extends TypeField<TDocumentCnpj, TDocumentCnpjFormatted> {
  private static readonly CNPJ_REGEX = /^\d{14}$/;

  override readonly typeInference = "FDocumentCnpj";

  override readonly config: ITypeFieldConfig<TDocumentCnpj> = {
    jsonSchemaType: "string",
    minLength: 14,
    maxLength: 14,
    serializeAsString: false,
  };

  private constructor(value: TDocumentCnpj, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TDocumentCnpj,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;

    if (!FDocumentCnpj.CNPJ_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "CNPJ must contain exactly 14 numeric digits."));
    }

    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TDocumentCnpj, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TDocumentCnpj>(raw: T, fieldPath = "DocumentCnpj"): Result<FDocumentCnpj, ExceptionValidation> {
    const typed = FDocumentCnpj.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentCnpj(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TDocumentCnpj, fieldPath = "DocumentCnpj"): FDocumentCnpj {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDocumentCnpj>(value: T, fieldPath = "DocumentCnpj"): Result<FDocumentCnpj, ExceptionValidation> {
    const typed = FDocumentCnpj.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentCnpj(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TDocumentCnpjFormatted {
    const v = this.getValue();
    return `${v.substring(0, 2)}.${v.substring(2, 5)}.${v.substring(5, 8)}/${v.substring(8, 12)}-${v.substring(12, 14)}`;
  }

  override getDescription(): string {
    return "Brazilian CNPJ document number (14 numeric digits).";
  }

  override getShortDescription(): string {
    return "CNPJ";
  }
}
