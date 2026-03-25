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

  static validateType(value: unknown, fieldPath: string): Result<TIdReq, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TIdReq>(raw: T, fieldPath = "IdReq"): Result<FIdReq, ExceptionValidation> {
    const typed = FIdReq.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const normalized = TypeField.normalize(typed.value, TypeField.createLevel);
    const instance = new FIdReq(normalized, fieldPath);
    const rules = instance.validateRules(normalized, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TIdReq, fieldPath = "IdReq"): FIdReq {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TIdReq>(value: T, fieldPath = "IdReq"): Result<FIdReq, ExceptionValidation> {
    const typed = FIdReq.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const normalized = TypeField.normalize(typed.value, TypeField.assignLevel);
    const instance = new FIdReq(normalized, fieldPath);
    const rules = instance.validateRules(normalized, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return this.getValue();
  }

  override getDescription(): string {
    return "Identificador único de requisição. Utilizado para rastrear requisições externas e garantir idempotência nas operações. Aceita qualquer formato de string.";
  }

  override getShortDescription(): string {
    return "ID de requisição";
  }
}
