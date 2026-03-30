import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import type { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";

const CRLF_REGEX = /[\r\n]/;
const NULL_BYTE_REGEX = /\0/;

export type TUrlQuery = string;
export type TUrlQueryFormatted = string;

export class FUrlQuery extends TypeField<TUrlQuery, TUrlQueryFormatted> {
  override readonly typeInference = "FUrlQuery";

  override readonly config: ITypeFieldConfig<TUrlQuery> = {
    jsonSchemaType: "string",
    serializeAsString: false,
    minLength: 0,
    maxLength: 4096,
  };

  private constructor(value: TUrlQuery, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath = "UrlQuery"): Result<TUrlQuery, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath, 0, 4096);
  }

  protected override validateRules(
    value: TUrlQuery,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel === "none") return ok(true);
    if (CRLF_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "Query string must not contain CRLF characters."));
    }
    if (NULL_BYTE_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "Query string must not contain null bytes."));
    }
    return ok(true);
  }

  static create<T = TUrlQuery>(raw: T, fieldPath = "UrlQuery"): Result<FUrlQuery, ExceptionValidation> {
    const typed = FUrlQuery.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FUrlQuery(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(value: TUrlQuery, fieldPath = "UrlQuery"): FUrlQuery {
    const result = FUrlQuery.create(value, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TUrlQuery>(value: T, fieldPath = "UrlQuery"): Result<FUrlQuery, ExceptionValidation> {
    const typed = FUrlQuery.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FUrlQuery(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override formatted(): TUrlQueryFormatted { return this.getValue(); }
  override toString(): string { return this.getValue(); }
  override getDescription(): string { return "URL query string (e.g., page=1&limit=10)"; }
  override getShortDescription(): string { return "Query"; }
}
