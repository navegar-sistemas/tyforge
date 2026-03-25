import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { v7 as uuidv7 } from "uuid";

export type TTraceId = string;
export type TTraceIdFormatted = string;

const UUID_V7_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class FTraceId extends TypeField<TTraceId, TTraceIdFormatted> {
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

  protected override validate(
    value: TTraceId,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validate(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!UUID_V7_PATTERN.test(this.getValue())) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "TraceId deve ser UUID v7 valido (versao 7, variante RFC 4122)",
        ),
      );
    }
    return OK_TRUE;
  }

  static create<T = TTraceId>(raw: T, fieldPath = "TraceId"): Result<FTraceId, ExceptionValidation> {
    const str = TypeGuard.isString(raw, fieldPath);
    if (isFailure(str)) return err(str.error);
    const value = TypeField.normalize(str.value, TypeField.createLevel);
    const instance = new FTraceId(value, fieldPath);
    const validation = instance.validate(value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: TTraceId, fieldPath = "TraceId"): FTraceId {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TTraceId>(value: T, fieldPath = "TraceId"): Result<FTraceId, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    const normalized = TypeField.normalize(str.value, TypeField.assignLevel);
    const instance = new FTraceId(normalized, fieldPath);
    const validation = instance.validate(normalized, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static generate(): FTraceId {
    const uuid = uuidv7();
    return FTraceId.createOrThrow(uuid, "TraceId");
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Identificador único de rastreamento distribuído no formato UUID v7 (RFC 9562). Usado para correlacionar logs, métricas e debug entre microserviços. Contém timestamp embutido para ordenação temporal.";
  }

  override getShortDescription(): string {
    return "Trace ID (UUID v7)";
  }
}
