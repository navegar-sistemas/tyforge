import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const OHashAlgorithm = {
  ECDSA_P256_SHA256: "ECDSA_P256_SHA256",
  ECDSA_P384_SHA384: "ECDSA_P384_SHA384",
  ED25519: "Ed25519",
  RSA_PKCS1_SHA256: "RSA_PKCS1_SHA256",
  RSA_PSS_SHA256: "RSA_PSS_SHA256",
} as const;

export type TKeyHashAlgorithm = keyof typeof OHashAlgorithm;
export type THashAlgorithm = (typeof OHashAlgorithm)[TKeyHashAlgorithm];
export type THashAlgorithmFormatted = string;

export class FHashAlgorithm extends TypeField<
  THashAlgorithm,
  THashAlgorithmFormatted
> {
  override readonly typeInference = "FHashAlgorithm";

  override readonly config: ITypeFieldConfig<THashAlgorithm> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 30,
    validateEnum: OHashAlgorithm,
    serializeAsString: false,
  };

  private constructor(value: THashAlgorithm, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(
    value: unknown,
    fieldPath: string,
  ): Result<THashAlgorithm, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    return TypeField.resolveEnum(OHashAlgorithm, str.value, fieldPath);
  }

  static create<T = THashAlgorithm>(
    raw: T,
    fieldPath = "HashAlgorithm",
  ): Result<FHashAlgorithm, ExceptionValidation> {
    const typed = FHashAlgorithm.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FHashAlgorithm(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(
    raw: THashAlgorithm,
    fieldPath = "HashAlgorithm",
  ): FHashAlgorithm {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = THashAlgorithm>(
    value: T,
    fieldPath = "HashAlgorithm",
  ): Result<FHashAlgorithm, ExceptionValidation> {
    const typed = FHashAlgorithm.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FHashAlgorithm(typed.value, fieldPath);
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

  override formatted(): THashAlgorithmFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Cryptographic hash or signing algorithm identifier.";
  }

  override getShortDescription(): string {
    return "Hash algorithm";
  }
}
