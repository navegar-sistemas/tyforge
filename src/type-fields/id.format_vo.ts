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

  protected override validateRules(
    value: TId,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!UUID_REGEX.test(this.getValue())) {
      return err(ExceptionValidation.create(fieldPath, "ID deve ser um UUID válido"));
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TId, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TId>(raw: T, fieldPath = "Id"): Result<FId, ExceptionValidation> {
    const typed = FId.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FId(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TId, fieldPath = "Id"): FId {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TId>(value: T, fieldPath = "Id"): Result<FId, ExceptionValidation> {
    const typed = FId.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FId(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
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
