import { TypeField, TValidationLevel } from "@tyforge/type-fields/type-field.base";
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

  protected override validateRules(
    value: TBearer,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    const v = this.getValue();
    if (!v.startsWith(FBearer.BEARER_PREFIX) || v.length <= 7) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Token deve começar com 'Bearer ' e ter conteúdo válido",
        ),
      );
    }
    return OK_TRUE;
  }

  static validateType(value: unknown, fieldPath: string): Result<TBearer, ExceptionValidation> {
    return TypeGuard.extractString(value, fieldPath);
  }

  static create<T = TBearer>(raw: T, fieldPath = "Bearer"): Result<FBearer, ExceptionValidation> {
    const typed = FBearer.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBearer(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TBearer, fieldPath = "Bearer"): FBearer {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TBearer>(value: T, fieldPath = "Bearer"): Result<FBearer, ExceptionValidation> {
    const typed = FBearer.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FBearer(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
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
    return "Bearer access token for API authentication. Must be a valid JWT string.";
  }

  override getShortDescription(): string {
    return "Token de acesso Bearer";
  }
}
