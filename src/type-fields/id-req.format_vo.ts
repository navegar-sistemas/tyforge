import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TIdReq = string;
export type TIdReqFormatted = string;

export class FIdReq extends TypeField<TIdReq, TIdReqFormatted> {
  override readonly typeInference = "FIdReq";

  override readonly config: ITypeFieldConfig<TIdReq> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 36,
    serializeAsString: false,
  };

  private constructor(value: TIdReq, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateRaw(value: unknown, fieldPath: string): Result<true, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath, 1, 36);
  }

  static create(
    raw: TIdReq,
    fieldPath = "IdReq",
  ): Result<FIdReq, ExceptionValidation> {
    const validation = FIdReq.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FIdReq(raw, fieldPath));
  }

  static createOrThrow(raw: TIdReq, fieldPath = "IdReq"): FIdReq {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TIdReq,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FIdReq.validateRaw(value, fieldPath);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return this.getValue().trim();
  }

  override getDescription(): string {
    return "Identificador único de requisição. Utilizado para rastrear requisições externas e garantir idempotência nas operações. Aceita qualquer formato de string.";
  }

  override getShortDescription(): string {
    return "ID de requisição";
  }
}
