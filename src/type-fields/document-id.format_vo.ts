import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TDocumentId = string;
export type TDocumentIdFormatted = string;

const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;
const BR_DOCUMENT_REGEX = /^\d{11}$|^\d{14}$/;

export class FDocumentId extends TypeField<TDocumentId, TDocumentIdFormatted> {
  override readonly typeInference = "FDocumentId";

  override readonly config: ITypeFieldConfig<TDocumentId> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 20,
    serializeAsString: false,
  };

  private constructor(value: TDocumentId, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TDocumentId,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (TypeField.locale === "br") {
      if (!BR_DOCUMENT_REGEX.test(value)) {
        return err(ExceptionValidation.create(fieldPath, "Brazilian document must be exactly 11 digits (CPF) or 14 digits (CNPJ)"));
      }
    } else {
      if (!ALPHANUMERIC_REGEX.test(value)) {
        return err(ExceptionValidation.create(fieldPath, "Document ID must contain only alphanumeric characters"));
      }
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TDocumentId, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TDocumentId>(raw: T, fieldPath = "DocumentId"): Result<FDocumentId, ExceptionValidation> {
    const typed = FDocumentId.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentId(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TDocumentId, fieldPath = "DocumentId"): FDocumentId {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDocumentId>(value: T, fieldPath = "DocumentId"): Result<FDocumentId, ExceptionValidation> {
    const typed = FDocumentId.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentId(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TDocumentIdFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Generic document identifier (alphanumeric). Locale-aware: validates CPF (11 digits) or CNPJ (14 digits) when TypeField.locale is 'br'.";
  }

  override getShortDescription(): string {
    return "Document ID";
  }
}
