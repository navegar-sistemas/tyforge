import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export const OBoolInt = {
  INVALIDO: 0,
  VALIDO: 1,
} as const;

export type TKeyBoolInt = keyof typeof OBoolInt;
export type TBoolInt = (typeof OBoolInt)[TKeyBoolInt];

export class FBoolInt extends TypeField<TBoolInt> {
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

  static create(
    raw: TBoolInt,
    fieldPath = "BoolInt",
  ): Result<FBoolInt, ExceptionValidation> {
    const inst = new FBoolInt(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
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
    // Validação da classe pai
    const baseValidation = super.validate(value, fieldPath);

    if (isFailure(baseValidation)) return baseValidation;

    // Validações customizadas

    const validateBoolInt: (value: TBoolInt) => boolean = (value) =>
      value === 0 || value === 1;
    if (!validateBoolInt(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Valor deve ser 0 (inválido) ou 1 (válido)",
        ),
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
    return "Validação dos dados do recebedor. Representa um valor booleano codificado como inteiro, onde 0 indica inválido e 1 indica válido. Utilizado para validação de dados e controle de status.";
  }

  override getShortDescription(): string {
    return "Validação booleana (0=Inválido, 1=Válido)";
  }
}
