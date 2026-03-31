import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const ODocumentType = {
  NATIONAL_ID: "NATIONAL_ID",
  DRIVER_LICENSE: "DRIVER_LICENSE",
  PASSPORT: "PASSPORT",
  RESIDENCE_PERMIT: "RESIDENCE_PERMIT",
  TAX_ID: "TAX_ID",
} as const;

export type TKeyDocumentType = keyof typeof ODocumentType;
export type TDocumentType = (typeof ODocumentType)[TKeyDocumentType];
export type TDocumentTypeFormatted = string;

export class FDocumentType extends TypeField<
  TDocumentType,
  TDocumentTypeFormatted
> {
  override readonly typeInference = "FDocumentType";

  override readonly config: ITypeFieldConfig<TDocumentType> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 20,
    validateEnum: ODocumentType,
    serializeAsString: false,
  };

  private constructor(value: TDocumentType, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(
    value: unknown,
    fieldPath: string,
  ): Result<TDocumentType, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    return TypeField.resolveEnum(ODocumentType, str.value, fieldPath);
  }

  static create<T = TDocumentType>(
    raw: T,
    fieldPath = "DocumentType",
  ): Result<FDocumentType, ExceptionValidation> {
    const typed = FDocumentType.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentType(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(
    raw: TDocumentType,
    fieldPath = "DocumentType",
  ): FDocumentType {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDocumentType>(
    value: T,
    fieldPath = "DocumentType",
  ): Result<FDocumentType, ExceptionValidation> {
    const typed = FDocumentType.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDocumentType(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.assignLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TDocumentTypeFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Document type identifier.";
  }

  override getShortDescription(): string {
    return "Document type";
  }
}
