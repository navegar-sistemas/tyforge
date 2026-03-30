import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import type { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";

// Enforces HTTPS protocol for production security
const HTTPS_REGEX = /^https:\/\//i;
// Allows HTTP only for local development (localhost and 127.0.0.1)
const LOCALHOST_REGEX = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;

// RFC 1918, link-local, loopback, and cloud metadata ranges
const PRIVATE_IP_PATTERNS = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^127\./,
  /^0\./,
  /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./,
  /^\[?::1\]?/,
  /^\[?fe80:/i,
  /^\[?fc00:/i,
  /^\[?fd/i,
];

export type TUrlOrigin = string;
export type TUrlOriginFormatted = string;

export class FUrlOrigin extends TypeField<TUrlOrigin, TUrlOriginFormatted> {
  override readonly typeInference = "FUrlOrigin";

  override readonly config: ITypeFieldConfig<TUrlOrigin> = {
    jsonSchemaType: "string",
    serializeAsString: false,
    minLength: 10,
    maxLength: 2048,
  };

  private constructor(value: TUrlOrigin, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath = "UrlOrigin"): Result<TUrlOrigin, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath, 10, 2048);
  }

  protected override validateRules(
    value: TUrlOrigin,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel === "none") return ok(true);
    const isLocalhost = LOCALHOST_REGEX.test(value);
    if (!HTTPS_REGEX.test(value) && !isLocalhost) {
      return err(ExceptionValidation.create(fieldPath, "Origin must use HTTPS (or HTTP for localhost/127.0.0.1 in development)."));
    }
    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      return err(ExceptionValidation.create(fieldPath, "Invalid origin URL format."));
    }
    // Block private/internal IPs to prevent SSRF — localhost exempted for development
    if (!isLocalhost) {
      const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
      for (const pattern of PRIVATE_IP_PATTERNS) {
        if (pattern.test(hostname)) {
          return err(ExceptionValidation.create(fieldPath, "Private or internal IP addresses are not allowed."));
        }
      }
    }
    return ok(true);
  }

  static create<T = TUrlOrigin>(raw: T, fieldPath = "UrlOrigin"): Result<FUrlOrigin, ExceptionValidation> {
    const typed = FUrlOrigin.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FUrlOrigin(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(value: TUrlOrigin, fieldPath = "UrlOrigin"): FUrlOrigin {
    const result = FUrlOrigin.create(value, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TUrlOrigin>(value: T, fieldPath = "UrlOrigin"): Result<FUrlOrigin, ExceptionValidation> {
    const typed = FUrlOrigin.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FUrlOrigin(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override formatted(): TUrlOriginFormatted { return this.getValue(); }
  override toString(): string { return this.getValue(); }
  override getDescription(): string { return "URL origin (protocol + host + port). HTTPS required, HTTP allowed only for localhost."; }
  override getShortDescription(): string { return "Origin"; }
}
