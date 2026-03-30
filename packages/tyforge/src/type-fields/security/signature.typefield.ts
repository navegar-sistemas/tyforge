import { TypeField, TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
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

  protected override validateRules(
    value: TSignature,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    const cleanValue = this.getValue().replace(/\s/g, "");
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

  static validateType(value: unknown, fieldPath: string): Result<TSignature, ExceptionValidation> {
    return TypeGuard.extractString(value, fieldPath);
  }

  static create<T = TSignature>(raw: T, fieldPath = "Signature"): Result<FSignature, ExceptionValidation> {
    const typed = FSignature.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FSignature(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TSignature, fieldPath = "Signature"): FSignature {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TSignature>(value: T, fieldPath = "Signature"): Result<FSignature, ExceptionValidation> {
    const typed = FSignature.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FSignature(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return this.getValue();
  }

  override getDescription(): string {
    return "Assinatura digital no formato base64. Utilizada para verificação de autenticidade e integridade de dados em comunicações seguras e autenticação assimétrica.";
  }

  override getShortDescription(): string {
    return "Assinatura digital base64";
  }
}
