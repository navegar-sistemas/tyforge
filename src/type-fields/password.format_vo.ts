import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TPassword = string;
export type TPasswordFormatted = string;

export class FPassword extends TypeField<TPassword, TPasswordFormatted> {
  override readonly typeInference = "FPassword";

  override readonly config: ITypeFieldConfig<TPassword> = {
    jsonSchemaType: "string",
    minLength: 8,
    maxLength: 128,
    serializeAsString: false,
  };

  private static readonly UPPERCASE_REGEX = /[A-Z]/;
  private static readonly LOWERCASE_REGEX = /[a-z]/;
  private static readonly DIGIT_REGEX = /[0-9]/;
  private static readonly SPECIAL_REGEX =
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

  private constructor(value: TPassword, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateRaw(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const base = TypeGuard.isString(value, fieldPath, 8, 128);
    if (!base.success) return base;

    if (typeof value !== "string") return base;
    const str = value;
    if (
      str.length < 8 ||
      !FPassword.UPPERCASE_REGEX.test(str) ||
      !FPassword.LOWERCASE_REGEX.test(str) ||
      !FPassword.DIGIT_REGEX.test(str) ||
      !FPassword.SPECIAL_REGEX.test(str)
    ) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial",
        ),
      );
    }

    return OK_TRUE;
  }

  static create(
    raw: TPassword,
    fieldPath = "Password",
  ): Result<FPassword, ExceptionValidation> {
    const validation = FPassword.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FPassword(raw, fieldPath));
  }

  static createOrThrow(raw: TPassword, fieldPath = "Password"): FPassword {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TPassword,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FPassword.validateRaw(value, fieldPath);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Senha de acesso segura para autenticação de usuários. Deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial. Utilizada para proteger o acesso a contas e sistemas com autenticação forte.";
  }

  override getShortDescription(): string {
    return "Senha segura de acesso";
  }
}
