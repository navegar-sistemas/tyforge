import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { v7 as uuidv7 } from "uuid";

export type TId = string;

export class FId extends TypeField<TId> {
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

  static create(raw: TId, fieldPath = "Id"): Result<FId, ExceptionValidation> {
    const parseId: (value: unknown) => TId = (value) => {
      return typeof value === "string" ? value.trim() : String(value);
    };
    const parsedValue = parseId(raw);
    const inst = new FId(parsedValue, fieldPath);
    const validation = inst.validate(parsedValue, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
  }

  static createOrThrow(raw: TId, fieldPath = "Id"): FId {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static generate(): FId {
    const uuid = uuidv7();
    return FId.createOrThrow(uuid, "Id");
  }

  static generateId(): string {
    return uuidv7();
  }

  override validate(
    value: TId,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const baseValidation = super.validate(value, fieldPath);
    if (isFailure(baseValidation)) return baseValidation;

    const validateUuid: (value: TId) => boolean = (value) => {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    };
    if (!validateUuid(value)) {
      return err(
        ExceptionValidation.create(fieldPath, "ID deve ser um UUID válido"),
      );
    }

    return ok(true);
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
