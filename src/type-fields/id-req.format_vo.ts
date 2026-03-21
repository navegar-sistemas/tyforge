import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TIdReq = string;

export class FIdReq extends TypeField<TIdReq> {
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

  static create(
    raw: TIdReq,
    fieldPath = "IdReq",
  ): Result<FIdReq, ExceptionValidation> {
    const inst = new FIdReq(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
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
    // Validação da classe pai
    const baseValidation = super.validate(value, fieldPath);

    if (isFailure(baseValidation)) return baseValidation;

    // Validações customizadas simplificadas
    // Aceita qualquer string não vazia (flexível para APIs externas)

    return ok(true);
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
