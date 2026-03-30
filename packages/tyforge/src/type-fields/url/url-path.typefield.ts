import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import type { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";

// Detects absolute URLs (with or without protocol) to reject non-relative paths
const ABSOLUTE_URL_REGEX = /^(?:[a-z]+:)?\/\//i;
// Detects directory traversal (../) in any position, including backslash variants
const PATH_TRAVERSAL_REGEX = /(?:^|[/\\])\.\.(?:[/\\]|$)/;
// Detects CRLF characters used in HTTP response splitting attacks
const CRLF_REGEX = /[\r\n]/;
// Detects null bytes used in path truncation attacks
const NULL_BYTE_REGEX = /\0/;

export type TUrlPath = string;
export type TUrlPathFormatted = string;

export class FUrlPath extends TypeField<TUrlPath, TUrlPathFormatted> {
  override readonly typeInference = "FUrlPath";

  override readonly config: ITypeFieldConfig<TUrlPath> = {
    jsonSchemaType: "string",
    serializeAsString: false,
    minLength: 1,
    maxLength: 2048,
  };

  private constructor(value: TUrlPath, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath = "UrlPath"): Result<TUrlPath, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath, 1, 2048);
  }

  protected override validateRules(
    value: TUrlPath,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel === "none") return ok(true);
    if (ABSOLUTE_URL_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "Path must be relative, not an absolute URL."));
    }
    if (PATH_TRAVERSAL_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "Path must not contain directory traversal (../)."));
    }
    if (CRLF_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "Path must not contain CRLF characters."));
    }
    if (NULL_BYTE_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "Path must not contain null bytes."));
    }
    return ok(true);
  }

  static create<T = TUrlPath>(raw: T, fieldPath = "UrlPath"): Result<FUrlPath, ExceptionValidation> {
    const typed = FUrlPath.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FUrlPath(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(value: TUrlPath, fieldPath = "UrlPath"): FUrlPath {
    const result = FUrlPath.create(value, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TUrlPath>(value: T, fieldPath = "UrlPath"): Result<FUrlPath, ExceptionValidation> {
    const typed = FUrlPath.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FUrlPath(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override formatted(): TUrlPathFormatted { return this.getValue(); }
  override toString(): string { return this.getValue(); }
  override getDescription(): string { return "Relative URL path. No traversal, CRLF, null bytes, or absolute URLs."; }
  override getShortDescription(): string { return "URL Path"; }
}
