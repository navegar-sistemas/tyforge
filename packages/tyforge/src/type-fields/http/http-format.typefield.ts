import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const OHttpFormat = {
  JSON: "json",
  FORM: "form",
} as const;

export type TKeyHttpFormat = keyof typeof OHttpFormat;
export type THttpFormat = (typeof OHttpFormat)[TKeyHttpFormat];
export type THttpFormatFormatted = string;

export class FHttpFormat extends TypeField<THttpFormat, THttpFormatFormatted> {
  override readonly typeInference = "FHttpFormat";

  override readonly config: ITypeFieldConfig<THttpFormat> = {
    jsonSchemaType: "string",
    serializeAsString: false,
    minLength: 3,
    maxLength: 4,
    validateEnum: OHttpFormat,
  };

  private constructor(value: THttpFormat, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath = "HttpFormat"): Result<THttpFormat, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    return TypeField.resolveEnum(OHttpFormat, str.value, fieldPath);
  }

  static create<T = THttpFormat>(raw: T, fieldPath = "HttpFormat"): Result<FHttpFormat, ExceptionValidation> {
    const typed = FHttpFormat.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FHttpFormat(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(value: THttpFormat, fieldPath = "HttpFormat"): FHttpFormat {
    const result = FHttpFormat.create(value, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = THttpFormat>(value: T, fieldPath = "HttpFormat"): Result<FHttpFormat, ExceptionValidation> {
    const typed = FHttpFormat.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FHttpFormat(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override formatted(): THttpFormatFormatted { return this.getValue(); }
  override toString(): string { return this.getValue(); }
  override getDescription(): string { return "HTTP body format (json, form)"; }
  override getShortDescription(): string { return "HTTP Format"; }
}
