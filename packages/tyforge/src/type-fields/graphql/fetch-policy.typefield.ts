import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const OFetchPolicy = {
  NETWORK_ONLY: "network-only",
  CACHE_FIRST: "cache-first",
  NO_CACHE: "no-cache",
} as const;

export type TKeyFetchPolicy = keyof typeof OFetchPolicy;
export type TFetchPolicy = (typeof OFetchPolicy)[TKeyFetchPolicy];
export type TFetchPolicyFormatted = string;

export class FFetchPolicy extends TypeField<
  TFetchPolicy,
  TFetchPolicyFormatted
> {
  override readonly typeInference = "FFetchPolicy";

  override readonly config: ITypeFieldConfig<TFetchPolicy> = {
    jsonSchemaType: "string",
    serializeAsString: false,
    minLength: 8,
    maxLength: 12,
    validateEnum: OFetchPolicy,
  };

  private constructor(value: TFetchPolicy, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(
    value: unknown,
    fieldPath = "FetchPolicy",
  ): Result<TFetchPolicy, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    return TypeField.resolveEnum(OFetchPolicy, str.value, fieldPath);
  }

  static create<T = TFetchPolicy>(
    raw: T,
    fieldPath = "FetchPolicy",
  ): Result<FFetchPolicy, ExceptionValidation> {
    const typed = FFetchPolicy.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FFetchPolicy(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(
    value: TFetchPolicy,
    fieldPath = "FetchPolicy",
  ): FFetchPolicy {
    const result = FFetchPolicy.create(value, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TFetchPolicy>(
    value: T,
    fieldPath = "FetchPolicy",
  ): Result<FFetchPolicy, ExceptionValidation> {
    const typed = FFetchPolicy.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FFetchPolicy(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.assignLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override formatted(): TFetchPolicyFormatted {
    return this.getValue();
  }
  override toString(): string {
    return this.getValue();
  }
  override getDescription(): string {
    return "Fetch policy (network-only, cache-first, no-cache)";
  }
  override getShortDescription(): string {
    return "Fetch Policy";
  }
}
