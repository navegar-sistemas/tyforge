import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import type { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";

const GRAPHQL_IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;

export type TGraphQLOperationName = string;
export type TGraphQLOperationNameFormatted = string;

export class FGraphQLOperationName extends TypeField<TGraphQLOperationName, TGraphQLOperationNameFormatted> {
  override readonly typeInference = "FGraphQLOperationName";

  override readonly config: ITypeFieldConfig<TGraphQLOperationName> = {
    jsonSchemaType: "string",
    serializeAsString: false,
    minLength: 1,
    maxLength: 255,
  };

  private constructor(value: TGraphQLOperationName, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath = "GraphQLOperationName"): Result<TGraphQLOperationName, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath, 1, 255);
  }

  protected override validateRules(
    value: TGraphQLOperationName,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel === "none") return ok(true);
    if (!GRAPHQL_IDENTIFIER_REGEX.test(value)) {
      return err(ExceptionValidation.create(fieldPath, "GraphQL operation name must be a valid identifier (letters, digits, underscores, starting with letter or underscore)."));
    }
    return ok(true);
  }

  static create<T = TGraphQLOperationName>(raw: T, fieldPath = "GraphQLOperationName"): Result<FGraphQLOperationName, ExceptionValidation> {
    const typed = FGraphQLOperationName.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FGraphQLOperationName(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(value: TGraphQLOperationName, fieldPath = "GraphQLOperationName"): FGraphQLOperationName {
    const result = FGraphQLOperationName.create(value, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TGraphQLOperationName>(value: T, fieldPath = "GraphQLOperationName"): Result<FGraphQLOperationName, ExceptionValidation> {
    const typed = FGraphQLOperationName.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FGraphQLOperationName(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override formatted(): TGraphQLOperationNameFormatted { return this.getValue(); }
  override toString(): string { return this.getValue(); }
  override getDescription(): string { return "GraphQL operation name (valid identifier)"; }
  override getShortDescription(): string { return "Operation Name"; }
}
