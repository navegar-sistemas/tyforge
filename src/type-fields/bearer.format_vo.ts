import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TBearer = string;
export type TBearerFormatted = string;

export class FBearer extends TypeField<TBearer, TBearerFormatted> {
  override readonly typeInference = "FBearer";

  private static readonly BEARER_PREFIX = "Bearer ";

  override readonly config: ITypeFieldConfig<TBearer> = {
    jsonSchemaType: "string",
    minLength: 100,
    maxLength: 5000,
    serializeAsString: false,
  };

  private constructor(value: TBearer, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateRaw(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const base = TypeGuard.isString(value, fieldPath, 100, 5000);
    if (!base.success) return base;

    if (typeof value !== "string") return base;
    const str = value;
    if (!str.startsWith(FBearer.BEARER_PREFIX) || str.length <= 7) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Token deve começar com 'Bearer ' e ter conteúdo válido",
        ),
      );
    }

    return OK_TRUE;
  }

  static create(
    raw: TBearer,
    fieldPath = "Bearer",
  ): Result<FBearer, ExceptionValidation> {
    const validation = FBearer.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FBearer(raw, fieldPath));
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
    return FBearer.validateRaw(value, fieldPath);
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
