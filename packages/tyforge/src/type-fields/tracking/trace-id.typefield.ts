import { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { FIdentifier, TIdentifier } from "../identity/identifier.typefield";
import { validate as uuidValidate, version as uuidVersion } from "uuid";

export type TTraceId = TIdentifier;
export type TTraceIdFormatted = string;

export class FTraceId extends FIdentifier {
  override readonly typeInference = "FTraceId";

  override readonly config: ITypeFieldConfig<TTraceId> = {
    jsonSchemaType: "string",
    minLength: 36,
    maxLength: 36,
    serializeAsString: false,
  };

  private constructor(value: TTraceId, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TTraceId,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!uuidValidate(value) || uuidVersion(value) !== 7) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "TraceId must be a valid UUID v7",
        ),
      );
    }
    return OK_TRUE;
  }

  static create<T = TTraceId>(
    raw: T,
    fieldPath = "TraceId",
  ): Result<FTraceId, ExceptionValidation> {
    const typed = FIdentifier.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FTraceId(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TTraceId, fieldPath = "TraceId"): FTraceId {
    const result = FTraceId.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TTraceId>(
    value: T,
    fieldPath = "TraceId",
  ): Result<FTraceId, ExceptionValidation> {
    const typed = FIdentifier.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FTraceId(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.assignLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static generate(fieldPath = "TraceId"): FTraceId {
    return FTraceId.createOrThrow(FIdentifier.generateId(), fieldPath);
  }

  override getDescription(): string {
    return (
      "Trace identifier (UUID v7 required)." +
      " Used for distributed tracing" +
      " with embedded timestamp."
    );
  }

  override getShortDescription(): string {
    return "Trace ID";
  }
}
