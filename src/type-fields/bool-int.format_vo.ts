import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export const OBoolInt = {
  INVALIDO: 0,
  VALIDO: 1,
} as const;

export type TKeyBoolInt = keyof typeof OBoolInt;
export type TBoolInt = (typeof OBoolInt)[TKeyBoolInt];
export type TBoolIntFormatted = string;

export class FBoolInt extends TypeField<TBoolInt, TBoolIntFormatted> {
  override readonly typeInference = "FBoolInt";

  override readonly config: ITypeFieldConfig<TBoolInt> = {
    jsonSchemaType: "number",
    min: 0,
    max: 1,
    decimalPrecision: 0,
    validateEnum: OBoolInt,
    serializeAsString: false,
  };

  private constructor(value: TBoolInt, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateRaw(value: unknown, fieldPath: string): Result<true, ExceptionValidation> {
    const resolved = FBoolInt.resolveEnum(OBoolInt, value, fieldPath);
    if (!resolved.success) return err(resolved.error);
    return OK_TRUE;
  }

  static create(
    raw: TBoolInt,
    fieldPath = "BoolInt",
  ): Result<FBoolInt, ExceptionValidation> {
    const validation = FBoolInt.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FBoolInt(raw, fieldPath));
  }

  static createOrThrow(raw: TBoolInt, fieldPath = "BoolInt"): FBoolInt {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TBoolInt,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FBoolInt.validateRaw(value, fieldPath);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Validação dos dados do recebedor. Representa um valor booleano codificado como inteiro, onde 0 indica inválido e 1 indica válido. Utilizado para validação de dados e controle de status.";
  }

  override getShortDescription(): string {
    return "Validação booleana (0=Inválido, 1=Válido)";
  }
}
