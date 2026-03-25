import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { v7 as uuidv7 } from "uuid";

export type TId = string;
export type TIdFormatted = string;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class FId extends TypeField<TId, TIdFormatted> {
  override readonly typeInference = "FId";

  override readonly config: ITypeFieldConfig<TId> = {
    jsonSchemaType: "string",
    minLength: 36,
    maxLength: 36,
    serializeAsString: false,
  };

  private constructor(value: TId, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validate(
    value: TId,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validate(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!UUID_REGEX.test(this.getValue())) {
      return err(ExceptionValidation.create(fieldPath, "ID deve ser um UUID válido"));
    }
    return OK_TRUE;
  }

  static create<T = TId>(raw: T, fieldPath = "Id"): Result<FId, ExceptionValidation> {
    const str = TypeGuard.isString(raw, fieldPath);
    if (isFailure(str)) return err(str.error);
    const value = TypeField.normalize(str.value, TypeField.createLevel);
    const instance = new FId(value, fieldPath);
    const validation = instance.validate(value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: TId, fieldPath = "Id"): FId {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TId>(value: T, fieldPath = "Id"): Result<FId, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    const normalized = TypeField.normalize(str.value, TypeField.assignLevel);
    const instance = new FId(normalized, fieldPath);
    const validation = instance.validate(normalized, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static generate(): FId {
    const uuid = uuidv7();
    return FId.createOrThrow(uuid, "Id");
  }

  static generateId(): string {
    return uuidv7();
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Identificador único universal (UUID) de um registro, entidade ou objeto no sistema. Deve ser uma string no formato UUID válido (qualquer versão) que serve como chave primária para identificação e referência.";
  }

  override getShortDescription(): string {
    return "Identificador único (UUID)";
  }
}
