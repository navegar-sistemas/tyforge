import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TPublicKeyPem = string;

export class FPublicKeyPem extends TypeField<TPublicKeyPem> {
  override readonly typeInference = "FPublicKeyPem";

  override readonly config: ITypeFieldConfig<TPublicKeyPem> = {
    jsonSchemaType: "string",
    minLength: 100,
    maxLength: 1000,
    serializeAsString: false,
  };

  private constructor(value: TPublicKeyPem, fieldPath: string) {
    super(value, fieldPath);
  }

  static create(
    raw: TPublicKeyPem,
    fieldPath = "PublicKeyPem",
  ): Result<FPublicKeyPem, ExceptionValidation> {
    const inst = new FPublicKeyPem(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
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
    // Validação da classe pai
    const baseValidation = super.validate(value, fieldPath);

    if (isFailure(baseValidation)) return baseValidation;

    // Validações customizadas

    const validatePem: (value: TPublicKeyPem) => boolean = (value) => {
      if (
        !value.includes("-----BEGIN PUBLIC KEY-----") ||
        !value.includes("-----END PUBLIC KEY-----")
      )
        return false;
      const base64 = value
        .replace("-----BEGIN PUBLIC KEY-----", "")
        .replace("-----END PUBLIC KEY-----", "")
        .replace(/\s/g, "");
      if (!/^[A-Za-z0-9+/=]+$/.test(base64)) return false;
      return base64.length >= 100;
    };
    if (!validatePem(value)) {
      return err(
        ExceptionValidation.create(fieldPath, "Chave pública PEM inválida"),
      );
    }

    return ok(true);
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
