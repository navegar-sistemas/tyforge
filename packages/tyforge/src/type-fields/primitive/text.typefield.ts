import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TText = string;
export type TTextFormatted = string;

export class FText extends TypeField<TText, TTextFormatted> {
  override readonly typeInference = "FText";

  override readonly config: ITypeFieldConfig<TText> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 4000,
    serializeAsString: false,
  };

  private constructor(value: TText, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(
    value: unknown,
    fieldPath: string,
  ): Result<TText, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TText>(
    raw: T,
    fieldPath = "Text",
  ): Result<FText, ExceptionValidation> {
    const typed = FText.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FText(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TText, fieldPath = "Text"): FText {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TText>(
    value: T,
    fieldPath = "Text",
  ): Result<FText, ExceptionValidation> {
    const typed = FText.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FText(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.assignLevel,
    );
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
    return (
      "Texto simples sem formatação específica." +
      " Campo genérico para armazenar qualquer" +
      " tipo de string, utilizado quando não há" +
      " regras específicas de validação" +
      " ou formatação."
    );
  }

  override getShortDescription(): string {
    return "Texto simples";
  }
}
