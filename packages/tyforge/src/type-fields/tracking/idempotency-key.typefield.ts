import { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { FIdentifier, TIdentifier } from "../identity/identifier.typefield";

export type TIdempotencyKey = TIdentifier;
export type TIdempotencyKeyFormatted = string;

const IDEMPOTENCY_KEY_REGEX = /^[a-zA-Z0-9\-]+$/;

export class FIdempotencyKey extends FIdentifier {
  override readonly typeInference = "FIdempotencyKey";

  override readonly config: ITypeFieldConfig<TIdempotencyKey> = {
    jsonSchemaType: "string",
    minLength: 32,
    maxLength: 36,
    serializeAsString: false,
  };

  private constructor(value: TIdempotencyKey, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TIdempotencyKey,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!IDEMPOTENCY_KEY_REGEX.test(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Idempotency key must contain only" +
            " alphanumeric characters and hyphens",
        ),
      );
    }
    return OK_TRUE;
  }

  static create<T = TIdempotencyKey>(
    raw: T,
    fieldPath = "IdempotencyKey",
  ): Result<FIdempotencyKey, ExceptionValidation> {
    const typed = FIdentifier.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FIdempotencyKey(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(
    raw: TIdempotencyKey,
    fieldPath = "IdempotencyKey",
  ): FIdempotencyKey {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TIdempotencyKey>(
    value: T,
    fieldPath = "IdempotencyKey",
  ): Result<FIdempotencyKey, ExceptionValidation> {
    const typed = FIdentifier.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FIdempotencyKey(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.assignLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TIdempotencyKeyFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return (
      "Idempotency key for preventing" +
      " duplicate operations" +
      " (32-36 alphanumeric characters" +
      " with hyphens)."
    );
  }

  override getShortDescription(): string {
    return "Idempotency key";
  }
}
