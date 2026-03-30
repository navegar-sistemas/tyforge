import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const OGender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
  NOT_INFORMED: "NOT_INFORMED",
} as const;

export type TKeyGender = keyof typeof OGender;
export type TGender = (typeof OGender)[TKeyGender];
export type TGenderFormatted = string;

export class FGender extends TypeField<TGender, TGenderFormatted> {
  override readonly typeInference = "FGender";

  override readonly config: ITypeFieldConfig<TGender> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 20,
    validateEnum: OGender,
    serializeAsString: false,
  };

  private constructor(value: TGender, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath: string): Result<TGender, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    return TypeField.resolveEnum(OGender, str.value, fieldPath);
  }

  static create<T = TGender>(raw: T, fieldPath = "Gender"): Result<FGender, ExceptionValidation> {
    const typed = FGender.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FGender(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TGender, fieldPath = "Gender"): FGender {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TGender>(value: T, fieldPath = "Gender"): Result<FGender, ExceptionValidation> {
    const typed = FGender.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FGender(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TGenderFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Gender identity.";
  }

  override getShortDescription(): string {
    return "Gender";
  }
}
