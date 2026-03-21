import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TDescricao = string;

export class FDescricao extends TypeField<TDescricao> {
  override readonly typeInference = "FDescricao";

  override readonly config: ITypeFieldConfig<TDescricao> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 1000,
    serializeAsString: false,
  };

  private constructor(value: TDescricao, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateRaw(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath, 1, 1000);
  }

  static create(
    raw: TDescricao,
    fieldPath = "Descricao",
  ): Result<FDescricao, ExceptionValidation> {
    const validation = FDescricao.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FDescricao(raw, fieldPath));
  }

  static createOrThrow(raw: TDescricao, fieldPath = "Descricao"): FDescricao {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TDescricao,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FDescricao.validateRaw(value, fieldPath);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Descrição detalhada. Deve fornecer informações suficientes para compreensão completa do objeto descrito.";
  }

  override getShortDescription(): string {
    return "Descrição detalhada";
  }
}
