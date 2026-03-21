import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TSignature = string;

export class FSignature extends TypeField<TSignature> {
  override readonly typeInference = "FSignature";

  override readonly config: ITypeFieldConfig<TSignature> = {
    jsonSchemaType: "string",
    minLength: 64,
    maxLength: 512,
    serializeAsString: false,
  };

  private constructor(value: TSignature, fieldPath: string) {
    super(value, fieldPath);
  }

  static create(
    raw: TSignature,
    fieldPath = "Signature",
  ): Result<FSignature, ExceptionValidation> {
    const inst = new FSignature(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
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
    // Validação da classe pai
    const baseValidation = super.validate(value, fieldPath);

    if (isFailure(baseValidation)) return baseValidation;

    // Validações customizadas

    const validateBase64: (value: TSignature) => boolean = (value) => {
      const cleanValue = value.replace(/\s/g, "");
      return /^[A-Za-z0-9+/]+=*$/.test(cleanValue) && cleanValue.length >= 64;
    };
    if (!validateBase64(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Assinatura deve ser uma string base64 válida",
        ),
      );
    }

    return ok(true);
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
