import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import {
  OHttpStatus,
  TKeyHttpStatus,
  THttpStatus,
} from "@tyforge/constants/http-status.constants";

export { OHttpStatus, TKeyHttpStatus, THttpStatus };
export type THttpStatusFormatted = string;

export class FHttpStatus extends TypeField<THttpStatus, THttpStatusFormatted> {
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

  static create<T = THttpStatus>(raw: T, fieldPath = "HttpStatus"): Result<FHttpStatus, ExceptionValidation> {
    const num = TypeGuard.extractNumber(raw, fieldPath);
    if (isFailure(num)) return err(num.error);
    const enumResult = TypeField.resolveEnum(OHttpStatus, num.value, fieldPath);
    if (isFailure(enumResult)) return err(enumResult.error);
    const value = TypeField.normalize(enumResult.value, TypeField.createLevel);
    const instance = new FHttpStatus(value, fieldPath);
    const validation = instance.validate(value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: THttpStatus, fieldPath = "HttpStatus"): FHttpStatus {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = THttpStatus>(value: T, fieldPath = "HttpStatus"): Result<FHttpStatus, ExceptionValidation> {
    const num = TypeGuard.extractNumber(value, fieldPath);
    if (isFailure(num)) return err(num.error);
    const enumResult = TypeField.resolveEnum(OHttpStatus, num.value, fieldPath);
    if (isFailure(enumResult)) return err(enumResult.error);
    const normalized = TypeField.normalize(enumResult.value, TypeField.assignLevel);
    const instance = new FHttpStatus(normalized, fieldPath);
    const validation = instance.validate(normalized, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
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
