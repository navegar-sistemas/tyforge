import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TPassword = string;

export class FPassword extends TypeField<TPassword> {
  override readonly typeInference = "FPassword";

  override readonly config: ITypeFieldConfig<TPassword> = {
    jsonSchemaType: "string",
    minLength: 8,
    maxLength: 128,
    serializeAsString: false,
  };

  private constructor(value: TPassword, fieldPath: string) {
    super(value, fieldPath);
  }

  static create(
    raw: TPassword,
    fieldPath = "Password",
  ): Result<FPassword, ExceptionValidation> {
    const inst = new FPassword(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
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
    // Validação da classe pai
    const baseValidation = super.validate(value, fieldPath);

    if (isFailure(baseValidation)) return baseValidation;

    // Validações customizadas

    const validatePassword: (value: TPassword) => boolean = (value) => {
      if (value.length < 8) return false;
      if (!/[A-Z]/.test(value)) return false;
      if (!/[a-z]/.test(value)) return false;
      if (!/[0-9]/.test(value)) return false;
      if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return false;
      return true;
    };
    if (!validatePassword(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Senha deve ter no mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial",
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
    return "Senha de acesso segura para autenticação de usuários. Deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial. Utilizada para proteger o acesso a contas e sistemas com autenticação forte.";
  }

  override getShortDescription(): string {
    return "Senha segura de acesso";
  }
}
