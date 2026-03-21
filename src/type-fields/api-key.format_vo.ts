import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { v4 as uuidv4, validate, version } from "uuid";

export type TApiKey = string;

export class FApiKey extends TypeField<TApiKey> {
  override readonly typeInference = "FApiKey";

  override readonly config: ITypeFieldConfig<TApiKey> = {
    jsonSchemaType: "string",
    minLength: 36,
    maxLength: 36,
    serializeAsString: false,
  };

  private constructor(value: TApiKey, fieldPath: string) {
    super(value, fieldPath);
  }

  static create(
    raw: TApiKey,
    fieldPath = "ApiKey",
  ): Result<FApiKey, ExceptionValidation> {
    const inst = new FApiKey(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
  }

  static createOrThrow(raw: TApiKey, fieldPath = "ApiKey"): FApiKey {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static generate(): FApiKey {
    return FApiKey.createOrThrow(uuidv4(), "ApiKey");
  }

  static generateString(): string {
    return uuidv4();
  }

  static isValid(value: string): boolean {
    return validate(value) && version(value) === 4;
  }

  override validate(
    value: TApiKey,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const baseValidation = super.validate(value, fieldPath);
    if (isFailure(baseValidation)) return baseValidation;

    if (!validate(value)) {
      return err(
        ExceptionValidation.create(fieldPath, "ApiKey deve ser UUID valido"),
      );
    }

    return ok(true);
  }

  toSafeDisplay(): string {
    const value = this.getValue();
    const segments = value.split("-");

    if (segments.length !== 5) {
      return "****-****-****-****-************";
    }

    return `${segments[0]}-****-****-****-${segments[4]}`;
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Chave de API no formato UUID v4 para autenticacao de aplicacoes cliente.";
  }

  override getShortDescription(): string {
    return "API Key (UUID v4)";
  }
}
