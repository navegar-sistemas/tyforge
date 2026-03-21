import { TypeField } from "@tyforge/type-fields/type-field.base";
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

  static validateRaw(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const base = TypeGuard.isString(value, fieldPath, 100, 1000);
    if (!base.success) return base;

    if (typeof value !== "string") return base;
    const str = value;
    if (
      !str.includes(FPublicKeyPem.PEM_BEGIN) ||
      !str.includes(FPublicKeyPem.PEM_END)
    ) {
      return err(
        ExceptionValidation.create(fieldPath, "Chave pública PEM inválida"),
      );
    }

    const base64 = str
      .replace(FPublicKeyPem.PEM_BEGIN, "")
      .replace(FPublicKeyPem.PEM_END, "")
      .replace(/\s/g, "");

    if (!FPublicKeyPem.BASE64_REGEX.test(base64) || base64.length < 100) {
      return err(
        ExceptionValidation.create(fieldPath, "Chave pública PEM inválida"),
      );
    }

    return OK_TRUE;
  }

  static create(
    raw: TPublicKeyPem,
    fieldPath = "PublicKeyPem",
  ): Result<FPublicKeyPem, ExceptionValidation> {
    const validation = FPublicKeyPem.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FPublicKeyPem(raw, fieldPath));
  }

  static createOrThrow(
    raw: TPublicKeyPem,
    fieldPath = "PublicKeyPem",
  ): FPublicKeyPem {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TPublicKeyPem,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FPublicKeyPem.validateRaw(value, fieldPath);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    const formatPublicKeyPem: (value: TPublicKeyPem) => TPublicKeyPem = (
      value,
    ) => value.trim();
    return formatPublicKeyPem(this.getValue());
  }

  override getDescription(): string {
    return "Chave pública no formato PEM para autenticação assimétrica (ECDSA P-521). Deve conter os delimitadores BEGIN/END e estar em base64.";
  }

  override getShortDescription(): string {
    return "Chave pública PEM (ECDSA)";
  }
}
