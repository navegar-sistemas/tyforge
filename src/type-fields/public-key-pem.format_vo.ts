import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TPublicKeyPem = string;
export type TPublicKeyPemFormatted = string;

export class FPublicKeyPem extends TypeField<TPublicKeyPem, TPublicKeyPemFormatted> {
  override readonly typeInference = "FPublicKeyPem";

  private static readonly PEM_BEGIN = "-----BEGIN PUBLIC KEY-----";
  private static readonly PEM_END = "-----END PUBLIC KEY-----";
  private static readonly BASE64_REGEX = /^[A-Za-z0-9+/=]+$/;

  override readonly config: ITypeFieldConfig<TPublicKeyPem> = {
    jsonSchemaType: "string",
    minLength: 100,
    maxLength: 1000,
    serializeAsString: false,
  };

  private constructor(value: TPublicKeyPem, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validate(
    value: TPublicKeyPem,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validate(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;

    const str = this.getValue();

    // Validate BEGIN marker is at the start and END marker is at the end
    if (!str.startsWith(FPublicKeyPem.PEM_BEGIN)) {
      return err(
        ExceptionValidation.create(fieldPath, "Invalid PEM: BEGIN marker must be at the start"),
      );
    }
    if (!str.endsWith(FPublicKeyPem.PEM_END)) {
      return err(
        ExceptionValidation.create(fieldPath, "Invalid PEM: END marker must be at the end"),
      );
    }

    const base64 = str
      .replace(FPublicKeyPem.PEM_BEGIN, "")
      .replace(FPublicKeyPem.PEM_END, "")
      .replace(/\s/g, "");

    if (!FPublicKeyPem.BASE64_REGEX.test(base64) || base64.length < 100) {
      return err(
        ExceptionValidation.create(fieldPath, "Invalid PEM: base64 content is malformed"),
      );
    }

    // Validate base64 padding -- length must be a multiple of 4
    if (base64.length % 4 !== 0) {
      return err(
        ExceptionValidation.create(fieldPath, "Invalid PEM: base64 padding is incorrect"),
      );
    }

    return OK_TRUE;
  }

  static create<T = TPublicKeyPem>(raw: T, fieldPath = "PublicKeyPem"): Result<FPublicKeyPem, ExceptionValidation> {
    const str = TypeGuard.isString(raw, fieldPath);
    if (isFailure(str)) return err(str.error);
    const value = TypeField.normalize(str.value, TypeField.createLevel, false);
    const instance = new FPublicKeyPem(value, fieldPath);
    const validation = instance.validate(value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: TPublicKeyPem, fieldPath = "PublicKeyPem"): FPublicKeyPem {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TPublicKeyPem>(value: T, fieldPath = "PublicKeyPem"): Result<FPublicKeyPem, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    const normalized = TypeField.normalize(str.value, TypeField.assignLevel, false);
    const instance = new FPublicKeyPem(normalized, fieldPath);
    const validation = instance.validate(normalized, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return this.getValue();
  }

  override getDescription(): string {
    return "Chave pública no formato PEM para autenticação assimétrica (ECDSA P-521). Deve conter os delimitadores BEGIN/END e estar em base64.";
  }

  override getShortDescription(): string {
    return "Chave pública PEM (ECDSA)";
  }
}
