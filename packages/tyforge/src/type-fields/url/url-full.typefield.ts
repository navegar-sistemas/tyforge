import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import type { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";

const URL_REGEX = /^https?:\/\/.+/i;

export type TUrlFull = string;
export type TUrlFullFormatted = string;

export class FUrlFull extends TypeField<TUrlFull, TUrlFullFormatted> {
  override readonly typeInference = "FUrlFull";

  override readonly config: ITypeFieldConfig<TUrlFull> = {
    jsonSchemaType: "string",
    serializeAsString: false,
    minLength: 10,
    maxLength: 2048,
  };

  private constructor(value: TUrlFull, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(
    value: unknown,
    fieldPath = "UrlFull",
  ): Result<TUrlFull, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath, 10, 2048);
  }

  protected override validateRules(
    value: TUrlFull,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel === "none") return ok(true);
    if (!URL_REGEX.test(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "URL must start with http:// or https://.",
        ),
      );
    }
    try {
      new URL(value);
    } catch {
      return err(ExceptionValidation.create(fieldPath, "Invalid URL format."));
    }
    return ok(true);
  }

  static create<T = TUrlFull>(
    raw: T,
    fieldPath = "UrlFull",
  ): Result<FUrlFull, ExceptionValidation> {
    const typed = FUrlFull.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FUrlFull(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(value: TUrlFull, fieldPath = "UrlFull"): FUrlFull {
    const result = FUrlFull.create(value, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TUrlFull>(
    value: T,
    fieldPath = "UrlFull",
  ): Result<FUrlFull, ExceptionValidation> {
    const typed = FUrlFull.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FUrlFull(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.assignLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override formatted(): TUrlFullFormatted {
    return this.getValue();
  }
  override toString(): string {
    return this.getValue();
  }
  override getDescription(): string {
    return "Complete URL with protocol, host, and optional path/query";
  }
  override getShortDescription(): string {
    return "URL";
  }
}
