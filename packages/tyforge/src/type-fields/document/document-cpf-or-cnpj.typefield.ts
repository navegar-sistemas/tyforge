import { TypeField, TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TDocumentCpfOrCnpj = string;
export type TDocumentCpfOrCnpjFormatted = string;

const CPF_REGEX = /^\d{11}$/;
const CNPJ_REGEX = /^\d{14}$/;

export class FDocumentCpfOrCnpj extends TypeField<TDocumentCpfOrCnpj, TDocumentCpfOrCnpjFormatted> {
  private static isValidCpfCheckDigits(cpf: string): boolean {
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== Number(cpf[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    return remainder === Number(cpf[10]);
  }

  private static isValidCnpjCheckDigits(cnpj: string): boolean {
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += Number(cnpj[i]) * weights1[i];
    let remainder = sum % 11;
    const check1 = remainder < 2 ? 0 : 11 - remainder;
    if (check1 !== Number(cnpj[12])) return false;
    sum = 0;
    for (let i = 0; i < 13; i++) sum += Number(cnpj[i]) * weights2[i];
    remainder = sum % 11;
    const check2 = remainder < 2 ? 0 : 11 - remainder;
    return check2 === Number(cnpj[13]);
  }

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

    if (value.length === 11 && !FDocumentCpfOrCnpj.isValidCpfCheckDigits(value)) {
      return err(ExceptionValidation.create(fieldPath, "CPF has invalid check digits."));
    }

    if (value.length === 14 && !FDocumentCpfOrCnpj.isValidCnpjCheckDigits(value)) {
      return err(ExceptionValidation.create(fieldPath, "CNPJ has invalid check digits."));
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
      return FDocumentCpfOrCnpj.applyMask(v, [3, ".", 3, ".", 3, "-", 2]);
    }
    return FDocumentCpfOrCnpj.applyMask(v, [2, ".", 3, ".", 3, "/", 4, "-", 2]);
  }

  override getDescription(): string {
    return "Brazilian CPF (11 digits) or CNPJ (14 digits) document number. Use isCpf() and isCnpj() to determine the type.";
  }

  override getShortDescription(): string {
    return "CPF or CNPJ";
  }
}
