import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import type { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";

const GRAPHQL_OPERATION_REGEX = /\b(query|mutation|subscription)\b/;

export type TGraphQLDocument = string;
export type TGraphQLDocumentFormatted = string;

export class FGraphQLDocument extends TypeField<
  TGraphQLDocument,
  TGraphQLDocumentFormatted
> {
  override readonly typeInference = "FGraphQLDocument";

  override readonly config: ITypeFieldConfig<TGraphQLDocument> = {
    jsonSchemaType: "string",
    serializeAsString: false,
    minLength: 1,
    maxLength: 100000,
  };

  private constructor(value: TGraphQLDocument, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(
    value: unknown,
    fieldPath = "GraphQLDocument",
  ): Result<TGraphQLDocument, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath, 1);
  }

  protected override validateRules(
    value: TGraphQLDocument,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel === "none") return ok(true);
    if (!value.includes("{") || !value.includes("}")) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "GraphQL document must contain at least one selection set.",
        ),
      );
    }
    if (
      validateLevel === "full" &&
      !GRAPHQL_OPERATION_REGEX.test(value) &&
      !value.trimStart().startsWith("{")
    ) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "GraphQL document must start with a query, mutation, subscription, or shorthand query.",
        ),
      );
    }
    return ok(true);
  }

  static create<T = TGraphQLDocument>(
    raw: T,
    fieldPath = "GraphQLDocument",
  ): Result<FGraphQLDocument, ExceptionValidation> {
    const typed = FGraphQLDocument.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FGraphQLDocument(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(
    value: TGraphQLDocument,
    fieldPath = "GraphQLDocument",
  ): FGraphQLDocument {
    const result = FGraphQLDocument.create(value, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TGraphQLDocument>(
    value: T,
    fieldPath = "GraphQLDocument",
  ): Result<FGraphQLDocument, ExceptionValidation> {
    const typed = FGraphQLDocument.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FGraphQLDocument(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.assignLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override formatted(): TGraphQLDocumentFormatted {
    return this.getValue();
  }
  override toString(): string {
    return this.getValue();
  }
  override getDescription(): string {
    return "GraphQL query, mutation, or subscription document";
  }
  override getShortDescription(): string {
    return "GraphQL Document";
  }
}
