import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const OPixKeyType = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "EMAIL",
  PHONE: "PHONE",
  EVP: "EVP",
} as const;

export type TKeyPixKeyType = keyof typeof OPixKeyType;
export type TPixKeyType = (typeof OPixKeyType)[TKeyPixKeyType];
export type TPixKeyTypeFormatted = string;

export class FPixKeyType extends TypeField<TPixKeyType, TPixKeyTypeFormatted> {
  override readonly typeInference = "FPixKeyType";

  override readonly config: ITypeFieldConfig<TPixKeyType> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 10,
    validateEnum: OPixKeyType,
    serializeAsString: false,
  };

  private constructor(value: TPixKeyType, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath: string): Result<TPixKeyType, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    return TypeField.resolveEnum(OPixKeyType, str.value, fieldPath);
  }

  static create<T = TPixKeyType>(raw: T, fieldPath = "PixKeyType"): Result<FPixKeyType, ExceptionValidation> {
    const typed = FPixKeyType.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FPixKeyType(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TPixKeyType, fieldPath = "PixKeyType"): FPixKeyType {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TPixKeyType>(value: T, fieldPath = "PixKeyType"): Result<FPixKeyType, ExceptionValidation> {
    const typed = FPixKeyType.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FPixKeyType(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TPixKeyTypeFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "PIX key type (CPF, CNPJ, EMAIL, PHONE, or EVP).";
  }

  override getShortDescription(): string {
    return "PIX key type";
  }
}
