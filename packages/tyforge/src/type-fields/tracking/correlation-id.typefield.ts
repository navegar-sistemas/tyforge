import { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { FIdentifier, TIdentifier } from "../identity/identifier.typefield";
import { validate as uuidValidate } from "uuid";

export type TCorrelationId = TIdentifier;
export type TCorrelationIdFormatted = string;

export class FCorrelationId extends FIdentifier {
  override readonly typeInference = "FCorrelationId";

  override readonly config: ITypeFieldConfig<TCorrelationId> = {
    jsonSchemaType: "string",
    minLength: 36,
    maxLength: 36,
    serializeAsString: false,
  };

  private constructor(value: TCorrelationId, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TCorrelationId,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!uuidValidate(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Correlation ID must be a valid UUID",
        ),
      );
    }
    return OK_TRUE;
  }

  static create<T = TCorrelationId>(
    raw: T,
    fieldPath = "CorrelationId",
  ): Result<FCorrelationId, ExceptionValidation> {
    const typed = FIdentifier.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FCorrelationId(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(
    raw: TCorrelationId,
    fieldPath = "CorrelationId",
  ): FCorrelationId {
    const result = FCorrelationId.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TCorrelationId>(
    value: T,
    fieldPath = "CorrelationId",
  ): Result<FCorrelationId, ExceptionValidation> {
    const typed = FIdentifier.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FCorrelationId(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.assignLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static generate(fieldPath = "CorrelationId"): FCorrelationId {
    return FCorrelationId.createOrThrow(FIdentifier.generateId(), fieldPath);
  }

  override getDescription(): string {
    return "Correlation identifier (UUID) for tracing requests across systems.";
  }

  override getShortDescription(): string {
    return "Correlation ID";
  }
}
