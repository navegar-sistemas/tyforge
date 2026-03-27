import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TDocumentCpfOrCnpj = string;
export type TDocumentCpfOrCnpjFormatted = string;

const CPF_REGEX = /^\d{11}$/;
const CNPJ_REGEX = /^\d{14}$/;

export class FDocumentCpfOrCnpj extends TypeField<TDocumentCpfOrCnpj, TDocumentCpfOrCnpjFormatted> {
  override readonly typeInference = "FDocumentCpfOrCnpj";

  override readonly config: ITypeFieldConfig<TDocumentCpfOrCnpj> = {
    jsonSchemaType: "string",
    minLength: 11,
    maxLength: 14,
    serializeAsString: false,
  };

  private constructor(value: TDocumentCpfOrCnpj, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TDocumentCpfOrCnpj,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!CPF_REGEX.test(value) && !CNPJ_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "Document must be a valid CPF (11 digits) or CNPJ (14 digits)"));
    }
    return OK_TRUE;
  }

  isCpf(): boolean {
    return this.getValue().length === 11;
  }

  isCnpj(): boolean {
    return this.getValue().length === 14;
  }

  static validateType(value: unknown, fieldPath: string): Result<TDocumentCpfOrCnpj, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TDocumentCpfOrCnpj>(raw: T, fieldPath = "DocumentCpfOrCnpj"): Result<FDocumentCpfOrCnpj, ExceptionValidation> {
    const typed = FDocumentCpfOrCnpj.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentCpfOrCnpj(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TDocumentCpfOrCnpj, fieldPath = "DocumentCpfOrCnpj"): FDocumentCpfOrCnpj {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDocumentCpfOrCnpj>(value: T, fieldPath = "DocumentCpfOrCnpj"): Result<FDocumentCpfOrCnpj, ExceptionValidation> {
    const typed = FDocumentCpfOrCnpj.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentCpfOrCnpj(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TDocumentCpfOrCnpjFormatted {
    const v = this.getValue();
    if (v.length <= 11) {
      return TypeField.applyMask(v, [3, ".", 3, ".", 3, "-", 2]);
    }
    return TypeField.applyMask(v, [2, ".", 3, ".", 3, "/", 4, "-", 2]);
  }

  override getDescription(): string {
    return "Brazilian CPF (11 digits) or CNPJ (14 digits) document number. Use isCpf() and isCnpj() to determine the type.";
  }

  override getShortDescription(): string {
    return "CPF or CNPJ";
  }
}
