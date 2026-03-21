import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TBoolean = boolean;

export class FBoolean extends TypeField<TBoolean> {
  override readonly typeInference = "FBoolean";

  override readonly config: ITypeFieldConfig<TBoolean> = {
    jsonSchemaType: "boolean",
    serializeAsString: false,
  };

  private constructor(value: TBoolean, fieldPath: string) {
    super(value, fieldPath);
  }

  static create(
    raw: TBoolean | number | string,
    fieldPath = "Boolean",
  ): Result<FBoolean, ExceptionValidation> {
    const parseBoolean: (value: unknown) => TBoolean = (value) => {
      if (typeof value === "boolean") {
        return value;
      }
      if (typeof value === "string") {
        const lowerValue = value.toLowerCase();
        if (
          lowerValue === "true" ||
          lowerValue === "1" ||
          lowerValue === "yes"
        ) {
          return true;
        }
        if (
          lowerValue === "false" ||
          lowerValue === "0" ||
          lowerValue === "no"
        ) {
          return false;
        }
      }
      if (typeof value === "number") {
        return value === 1;
      }
      return Boolean(value);
    };
    const parsedValue = parseBoolean(raw);
    const inst = new FBoolean(parsedValue, fieldPath);
    const validation = inst.validate(parsedValue, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
  }

  static createOrThrow(
    raw: TBoolean | number | string,
    fieldPath = "Boolean",
  ): FBoolean {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TBoolean,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    // Validação da classe pai
    const baseValidation = super.validate(value, fieldPath);

    if (isFailure(baseValidation)) return baseValidation;

    // Validações customizadas

    const validateBoolean: (value: TBoolean) => boolean = (value) =>
      typeof value === "boolean";
    if (!validateBoolean(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Valor deve ser um booleano válido",
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
    return "Valor booleano verdadeiro ou falso. Representa um estado lógico que pode ser verdadeiro (true) ou falso (false). Utilizado para flags, status simples e condições lógicas no sistema.";
  }

  override getShortDescription(): string {
    return "Valor booleano (true/false)";
  }
}
