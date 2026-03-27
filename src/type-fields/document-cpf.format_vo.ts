import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TDocumentCpf = string;
export type TDocumentCpfFormatted = string;

export class FDocumentCpf extends TypeField<TDocumentCpf, TDocumentCpfFormatted> {
  private static readonly CPF_REGEX = /^\d{11}$/;

  override readonly typeInference = "FDocumentCpf";

  override readonly config: ITypeFieldConfig<TDocumentCpf> = {
    jsonSchemaType: "string",
    minLength: 11,
    maxLength: 11,
    serializeAsString: false,
  };

  private constructor(value: TDocumentCpf, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TDocumentCpf,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;

    if (!FDocumentCpf.CPF_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "CPF must contain exactly 11 numeric digits."));
    }

    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TDocumentCpf, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TDocumentCpf>(raw: T, fieldPath = "DocumentCpf"): Result<FDocumentCpf, ExceptionValidation> {
    const typed = FDocumentCpf.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentCpf(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TDocumentCpf, fieldPath = "DocumentCpf"): FDocumentCpf {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDocumentCpf>(value: T, fieldPath = "DocumentCpf"): Result<FDocumentCpf, ExceptionValidation> {
    const typed = FDocumentCpf.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentCpf(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TDocumentCpfFormatted {
    return TypeField.applyMask(this.getValue(), [3, ".", 3, ".", 3, "-", 2]);
  }

  override getDescription(): string {
    return "Brazilian CPF document number (11 numeric digits).";
  }

  override getShortDescription(): string {
    return "CPF";
  }
}
