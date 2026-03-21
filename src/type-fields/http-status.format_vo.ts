import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import {
  OHttpStatus,
  TKeyHttpStatus,
  THttpStatus,
} from "@tyforge/constants/http-status.constants";

export { OHttpStatus, TKeyHttpStatus, THttpStatus };

export class FHttpStatus extends TypeField<THttpStatus, string> {
  override readonly typeInference = "FHttpStatus";

  override readonly config: ITypeFieldConfig<THttpStatus> = {
    jsonSchemaType: "number",
    min: 200,
    max: 504,
    decimalPrecision: 0,
    validateEnum: OHttpStatus,
    serializeAsString: false,
  };

  private constructor(value: THttpStatus, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateRaw(value: unknown, fieldPath: string): Result<true, ExceptionValidation> {
    const resolved = FHttpStatus.resolveEnum(OHttpStatus, value, fieldPath);
    if (!resolved.success) return err(resolved.error);
    return OK_TRUE;
  }

  static create(
    raw: THttpStatus,
    fieldPath = "HttpStatus",
  ): Result<FHttpStatus, ExceptionValidation> {
    const validation = FHttpStatus.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FHttpStatus(raw, fieldPath));
  }

  static createOrThrow(
    raw: THttpStatus,
    fieldPath = "HttpStatus",
  ): FHttpStatus {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: THttpStatus,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FHttpStatus.validateRaw(value, fieldPath);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Código de status HTTP conforme especificação RFC 7231. Representa o resultado de uma requisição HTTP, incluindo códigos de sucesso (2xx), redirecionamento (3xx), erro do cliente (4xx) e erro do servidor (5xx).";
  }

  override getShortDescription(): string {
    return "Código de status HTTP";
  }
}
