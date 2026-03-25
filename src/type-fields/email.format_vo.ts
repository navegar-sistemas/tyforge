import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TEmail = string;
export type TEmailFormatted = string;

export class FEmail extends TypeField<TEmail, TEmailFormatted> {
  // HTML5 spec email regex
  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
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

  protected override validateRules(
    value: TEmail,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!FEmail.EMAIL_REGEX.test(this.getValue())) {
      return err(ExceptionValidation.create(fieldPath, "Email deve ter formato válido"));
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TEmail, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TEmail>(raw: T, fieldPath = "Email"): Result<FEmail, ExceptionValidation> {
    const typed = FEmail.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const normalized = TypeField.normalize(typed.value, TypeField.createLevel);
    const instance = new FEmail(normalized, fieldPath);
    const rules = instance.validateRules(normalized, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TEmail, fieldPath = "Email"): FEmail {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TEmail>(value: T, fieldPath = "Email"): Result<FEmail, ExceptionValidation> {
    const typed = FEmail.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const normalized = TypeField.normalize(typed.value, TypeField.assignLevel);
    const instance = new FEmail(normalized, fieldPath);
    const rules = instance.validateRules(normalized, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return this.getValue().toLowerCase();
  }

  override getDescription(): string {
    return "Endereço de email eletrônico válido seguindo o padrão RFC 5322.";
  }

  override getShortDescription(): string {
    return "Endereço de email válido";
  }
}
