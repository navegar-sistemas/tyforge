import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TEmail = string;

export class FEmail extends TypeField<TEmail, string> {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

  static validateRaw(value: unknown, fieldPath: string): Result<true, ExceptionValidation> {
    const base = TypeGuard.isString(value, fieldPath, 5, 200);
    if (!base.success) return base;
    if (!FEmail.EMAIL_REGEX.test(value as string)) {
      return err(ExceptionValidation.create(fieldPath, "Email deve ter formato válido"));
    }
    return OK_TRUE;
  }

  static create(
    raw: TEmail,
    fieldPath = "Email",
  ): Result<FEmail, ExceptionValidation> {
    const validation = FEmail.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FEmail(raw, fieldPath));
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
    return FEmail.validateRaw(value, fieldPath);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return this.getValue().toLowerCase().trim();
  }

  override getDescription(): string {
    return "Endereço de email eletrônico válido seguindo o padrão RFC 5322.";
  }

  override getShortDescription(): string {
    return "Endereço de email válido";
  }
}
