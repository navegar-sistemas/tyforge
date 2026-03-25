import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const OBoolInt = {
  INVALID: 0,
  VALID: 1,
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

  static create<T = TBoolInt>(raw: T, fieldPath = "BoolInt"): Result<FBoolInt, ExceptionValidation> {
    const num = TypeGuard.extractNumber(raw, fieldPath);
    if (isFailure(num)) return err(num.error);
    const enumResult = TypeField.resolveEnum(OBoolInt, num.value, fieldPath);
    if (isFailure(enumResult)) return err(enumResult.error);
    const value = TypeField.normalize(enumResult.value, TypeField.createLevel);
    const instance = new FBoolInt(value, fieldPath);
    const validation = instance.validate(value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: TBoolInt, fieldPath = "BoolInt"): FBoolInt {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TBoolInt>(value: T, fieldPath = "BoolInt"): Result<FBoolInt, ExceptionValidation> {
    const num = TypeGuard.extractNumber(value, fieldPath);
    if (isFailure(num)) return err(num.error);
    const enumResult = TypeField.resolveEnum(OBoolInt, num.value, fieldPath);
    if (isFailure(enumResult)) return err(enumResult.error);
    const normalized = TypeField.normalize(enumResult.value, TypeField.assignLevel);
    const instance = new FBoolInt(normalized, fieldPath);
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
    return "Validação dos dados do recebedor. Representa um valor booleano codificado como inteiro, onde 0 indica inválido e 1 indica válido. Utilizado para validação de dados e controle de status.";
  }

  override getShortDescription(): string {
    return "Validação booleana (0=Inválido, 1=Válido)";
  }
}
