import { TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeField } from "@tyforge/type-fields/type-field.base";
import { FIdentifier, TIdentifier } from "./identifier.format_vo";

export type TCertificateThumbprint = TIdentifier;
export type TCertificateThumbprintFormatted = string;

const HEX_REGEX = /^[0-9A-Fa-f]+$/;

export class FCertificateThumbprint extends FIdentifier {
  override readonly typeInference = "FCertificateThumbprint";

  // Two-level validation: config range (40-64) rejects obvious outliers at the base level,
  // while validateRules further restricts to exactly 40 (SHA-1) or 64 (SHA-256) characters.
  override readonly config: ITypeFieldConfig<TCertificateThumbprint> = {
    jsonSchemaType: "string",
    minLength: 40,
    maxLength: 64,
    serializeAsString: false,
  };

  private constructor(value: TCertificateThumbprint, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TCertificateThumbprint,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!HEX_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "Certificate thumbprint must contain only hexadecimal characters"));
    }
    if (value.length !== 40 && value.length !== 64) {
      return err(ExceptionValidation.create(fieldPath, "Certificate thumbprint must be exactly 40 characters (SHA-1) or 64 characters (SHA-256)"));
    }
    return OK_TRUE;
  }


  static create<T = TCertificateThumbprint>(raw: T, fieldPath = "CertificateThumbprint"): Result<FCertificateThumbprint, ExceptionValidation> {
    const typed = FIdentifier.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FCertificateThumbprint(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TCertificateThumbprint, fieldPath = "CertificateThumbprint"): FCertificateThumbprint {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TCertificateThumbprint>(value: T, fieldPath = "CertificateThumbprint"): Result<FCertificateThumbprint, ExceptionValidation> {
    const typed = FIdentifier.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FCertificateThumbprint(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TCertificateThumbprintFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Certificate thumbprint in hexadecimal (SHA-1: 40 chars, SHA-256: 64 chars).";
  }

  override getShortDescription(): string {
    return "Certificate thumbprint";
  }
}
