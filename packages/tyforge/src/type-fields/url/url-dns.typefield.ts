import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import type { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";

const DNS_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/i;

export type TUrlDns = string;
export type TUrlDnsFormatted = string;

export class FUrlDns extends TypeField<TUrlDns, TUrlDnsFormatted> {
  override readonly typeInference = "FUrlDns";

  override readonly config: ITypeFieldConfig<TUrlDns> = {
    jsonSchemaType: "string",
    serializeAsString: false,
    minLength: 1,
    maxLength: 253,
  };

  private constructor(value: TUrlDns, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath = "UrlDns"): Result<TUrlDns, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath, 1, 253);
  }

  protected override validateRules(
    value: TUrlDns,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel === "none") return ok(true);
    if (!DNS_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "Invalid DNS hostname format."));
    }
    return ok(true);
  }

  static create<T = TUrlDns>(raw: T, fieldPath = "UrlDns"): Result<FUrlDns, ExceptionValidation> {
    const typed = FUrlDns.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FUrlDns(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(value: TUrlDns, fieldPath = "UrlDns"): FUrlDns {
    const result = FUrlDns.create(value, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TUrlDns>(value: T, fieldPath = "UrlDns"): Result<FUrlDns, ExceptionValidation> {
    const typed = FUrlDns.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FUrlDns(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override formatted(): TUrlDnsFormatted { return this.getValue(); }
  override toString(): string { return this.getValue(); }
  override getDescription(): string { return "DNS hostname (e.g., api.example.com)"; }
  override getShortDescription(): string { return "DNS"; }
}
