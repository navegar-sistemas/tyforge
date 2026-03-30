import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const OPersonType = {
  INDIVIDUAL: "INDIVIDUAL",
  LEGAL_ENTITY: "LEGAL_ENTITY",
} as const;

export type TKeyPersonType = keyof typeof OPersonType;
export type TPersonType = (typeof OPersonType)[TKeyPersonType];
export type TPersonTypeFormatted = string;

export class FPersonType extends TypeField<TPersonType, TPersonTypeFormatted> {
  override readonly typeInference = "FPersonType";

  override readonly config: ITypeFieldConfig<TPersonType> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 20,
    validateEnum: OPersonType,
    serializeAsString: false,
  };

  private constructor(value: TPersonType, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath: string): Result<TPersonType, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    return TypeField.resolveEnum(OPersonType, str.value, fieldPath);
  }

  static create<T = TPersonType>(raw: T, fieldPath = "PersonType"): Result<FPersonType, ExceptionValidation> {
    const typed = FPersonType.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FPersonType(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TPersonType, fieldPath = "PersonType"): FPersonType {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TPersonType>(value: T, fieldPath = "PersonType"): Result<FPersonType, ExceptionValidation> {
    const typed = FPersonType.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FPersonType(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TPersonTypeFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Person type (individual or legal entity).";
  }

  override getShortDescription(): string {
    return "Person type";
  }
}
