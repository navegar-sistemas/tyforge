import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

export type TEmail = string;

export class FEmail extends TypeField<TEmail> {
  override readonly typeInference = "FEmail";

  override readonly config: ITypeFieldConfig<TEmail> = {
    jsonSchemaType: "string",
    minLength: 5,
    maxLength: 200,
    serializeAsString: false,
  };

  private constructor(value: TEmail, fieldPath: string) {
    super(value, fieldPath);
  }

  static create(
    raw: TEmail,
    fieldPath = "Email",
  ): Result<FEmail, ExceptionValidation> {
    const inst = new FEmail(raw, fieldPath);
    const validation = inst.validate(raw, fieldPath);

    if (!validation.success) {
      return err(validation.error);
    }
    return ok(inst);
  }

  static createOrThrow(raw: TEmail, fieldPath = "Email"): FEmail {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  override validate(
    value: TEmail,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    // Validação da classe pai
    const baseValidation = super.validate(value, fieldPath);

    if (isFailure(baseValidation)) return baseValidation;

    // Validações customizadas

    const validateEmail: (value: TEmail) => boolean = (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    };
    if (!validateEmail(value)) {
      return err(
        ExceptionValidation.create(fieldPath, "Email deve ter formato válido"),
      );
    }

    return ok(true);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    const formatEmail: (value: TEmail) => TEmail = (value) =>
      value.toLowerCase().trim();
    return formatEmail(this.getValue());
  }

  override getDescription(): string {
    return "Endereço de email eletrônico válido seguindo o padrão RFC 5322. Deve conter um símbolo @ e um domínio válido. Utilizado para comunicação e identificação de usuários no sistema.";
  }

  override getShortDescription(): string {
    return "Endereço de email válido";
  }
}
