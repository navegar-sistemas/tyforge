import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
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

  protected override validateRules(
    value: TPassword,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    const v = this.getValue();
    if (
      v.length < 8 ||
      !FPassword.UPPERCASE_REGEX.test(v) ||
      !FPassword.LOWERCASE_REGEX.test(v) ||
      !FPassword.DIGIT_REGEX.test(v) ||
      !FPassword.SPECIAL_REGEX.test(v)
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

  static validateType(value: unknown, fieldPath: string): Result<TPassword, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TPassword>(raw: T, fieldPath = "Password"): Result<FPassword, ExceptionValidation> {
    const typed = FPassword.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const normalized = TypeField.normalize(typed.value, TypeField.createLevel, false);
    const instance = new FPassword(normalized, fieldPath);
    const rules = instance.validateRules(normalized, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TPassword, fieldPath = "Password"): FPassword {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TPassword>(value: T, fieldPath = "Password"): Result<FPassword, ExceptionValidation> {
    const typed = FPassword.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const normalized = TypeField.normalize(typed.value, TypeField.assignLevel, false);
    const instance = new FPassword(normalized, fieldPath);
    const rules = instance.validateRules(normalized, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
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
