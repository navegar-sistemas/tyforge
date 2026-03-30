import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const OHttpMethod = {
  POST: "POST",
  PUT: "PUT",
  GET: "GET",
  DELETE: "DELETE",
  PATCH: "PATCH",
} as const;

export type TKeyHttpMethod = keyof typeof OHttpMethod;
export type THttpMethod = (typeof OHttpMethod)[TKeyHttpMethod];
export type THttpMethodFormatted = string;

export class FHttpMethod extends TypeField<THttpMethod, THttpMethodFormatted> {
  override readonly typeInference = "FHttpMethod";

  override readonly config: ITypeFieldConfig<THttpMethod> = {
    jsonSchemaType: "string",
    serializeAsString: false,
    minLength: 3,
    maxLength: 6,
    validateEnum: OHttpMethod,
  };

  private constructor(value: THttpMethod, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath = "HttpMethod"): Result<THttpMethod, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    return TypeField.resolveEnum(OHttpMethod, str.value, fieldPath);
  }

  static create<T = THttpMethod>(raw: T, fieldPath = "HttpMethod"): Result<FHttpMethod, ExceptionValidation> {
    const typed = FHttpMethod.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FHttpMethod(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(value: THttpMethod, fieldPath = "HttpMethod"): FHttpMethod {
    const result = FHttpMethod.create(value, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = THttpMethod>(value: T, fieldPath = "HttpMethod"): Result<FHttpMethod, ExceptionValidation> {
    const typed = FHttpMethod.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FHttpMethod(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override formatted(): THttpMethodFormatted { return this.getValue(); }
  override toString(): string { return this.getValue(); }
  override getDescription(): string { return "HTTP method (GET, POST, PUT, DELETE, PATCH)"; }
  override getShortDescription(): string { return "HTTP Method"; }
}
