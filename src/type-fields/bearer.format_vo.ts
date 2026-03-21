import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TBearer = string;

export class FBearer extends TypeField<TBearer> {
  override readonly typeInference = "FBearer";

  override readonly config: ITypeFieldConfig<TBearer> = {
    jsonSchemaType: "string",
    minLength: 100,
    maxLength: 5000,
    serializeAsString: false,
  };

  private constructor(value: TBearer, fieldPath: string) {
    super(value, fieldPath);
  }

  static create(
    raw: TBearer,
    fieldPath = "Bearer",
  ): Result<FBearer, ExceptionValidation> {
    const inst = new FBearer(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
  }

  static createOrThrow(raw: TBearer, fieldPath = "Bearer"): FBearer {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TBearer,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    // Validação da classe pai
    const baseValidation = super.validate(value, fieldPath);

    if (isFailure(baseValidation)) return baseValidation;

    // Validações customizadas

    const validateBearer: (value: TBearer) => boolean = (value) => {
      return value.startsWith("Bearer ") && value.length > 7;
    };
    if (!validateBearer(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Token deve começar com 'Bearer ' e ter conteúdo válido",
        ),
      );
    }

    return ok(true);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    const formatBearer: (value: TBearer) => TBearer = (value) => {
      if (!value.startsWith("Bearer ")) {
        return `Bearer ${value}`;
      }
      return value;
    };
    return formatBearer(this.getValue());
  }

  override getDescription(): string {
    return "Token de acesso Bearer para autenticação em APIs e serviços. Deve ser uma string JWT válida que contém informações de autorização e identidade do usuário. Utilizado para autenticação e autorização em requisições HTTP.";
  }

  override getShortDescription(): string {
    return "Token de acesso Bearer";
  }
}
