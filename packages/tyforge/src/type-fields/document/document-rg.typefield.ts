import { TypeField, TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TDocumentRg = string;
export type TDocumentRgFormatted = string;

export class FDocumentRg extends TypeField<TDocumentRg, TDocumentRgFormatted> {
  private static readonly ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;
  override readonly typeInference = "FDocumentRg";

  override readonly config: ITypeFieldConfig<TDocumentRg> = {
    jsonSchemaType: "string",
    minLength: 7,
    maxLength: 14,
    serializeAsString: false,
  };

  private constructor(value: TDocumentRg, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TDocumentRg,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!FDocumentRg.ALPHANUMERIC_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "RG must contain only alphanumeric characters"));
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TDocumentRg, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TDocumentRg>(raw: T, fieldPath = "DocumentRg"): Result<FDocumentRg, ExceptionValidation> {
    const typed = FDocumentRg.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentRg(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TDocumentRg, fieldPath = "DocumentRg"): FDocumentRg {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDocumentRg>(value: T, fieldPath = "DocumentRg"): Result<FDocumentRg, ExceptionValidation> {
    const typed = FDocumentRg.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentRg(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TDocumentRgFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Brazilian RG (identity document) number (7-14 alphanumeric characters).";
  }

  override getShortDescription(): string {
    return "RG";
  }
}
