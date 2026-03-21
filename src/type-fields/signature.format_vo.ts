import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TSignature = string;
export type TSignatureFormatted = string;

export class FSignature extends TypeField<TSignature, TSignatureFormatted> {
  override readonly typeInference = "FSignature";

  private static readonly BASE64_REGEX = /^[A-Za-z0-9+/]+=*$/;

  override readonly config: ITypeFieldConfig<TSignature> = {
    jsonSchemaType: "string",
    minLength: 64,
    maxLength: 512,
    serializeAsString: false,
  };

  private constructor(value: TSignature, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateRaw(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const base = TypeGuard.isString(value, fieldPath, 64, 512);
    if (!base.success) return base;

    if (typeof value !== "string") return base;
    const str = value;
    const cleanValue = str.replace(/\s/g, "");
    if (!FSignature.BASE64_REGEX.test(cleanValue) || cleanValue.length < 64) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Assinatura deve ser uma string base64 válida",
        ),
      );
    }

    return OK_TRUE;
  }

  static create(
    raw: TSignature,
    fieldPath = "Signature",
  ): Result<FSignature, ExceptionValidation> {
    const validation = FSignature.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FSignature(raw, fieldPath));
  }

  static createOrThrow(raw: TSignature, fieldPath = "Signature"): FSignature {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TSignature,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FSignature.validateRaw(value, fieldPath);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    const formatSignature: (value: TSignature) => TSignature = (value) =>
      value.trim();
    return formatSignature(this.getValue());
  }

  override getDescription(): string {
    return "Assinatura digital no formato base64. Utilizada para verificação de autenticidade e integridade de dados em comunicações seguras e autenticação assimétrica.";
  }

  override getShortDescription(): string {
    return "Assinatura digital base64";
  }
}
