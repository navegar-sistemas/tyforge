import {
  TypeField,
  TValidationLevel,
} from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { v4 as uuidv4, validate, version } from "uuid";

export type TApiKey = string;
export type TApiKeyFormatted = string;

export class FApiKey extends TypeField<TApiKey, TApiKeyFormatted> {
  override readonly typeInference = "FApiKey";

  override readonly config: ITypeFieldConfig<TApiKey> = {
    jsonSchemaType: "string",
    minLength: 36,
    maxLength: 36,
    serializeAsString: false,
  };

  private constructor(value: TApiKey, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TApiKey,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!validate(this.getValue())) {
      return err(
        ExceptionValidation.create(fieldPath, "ApiKey deve ser UUID valido"),
      );
    }
    return OK_TRUE;
  }

  static validateType(
    value: unknown,
    fieldPath: string,
  ): Result<TApiKey, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TApiKey>(
    raw: T,
    fieldPath = "ApiKey",
  ): Result<FApiKey, ExceptionValidation> {
    const typed = FApiKey.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FApiKey(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TApiKey, fieldPath = "ApiKey"): FApiKey {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TApiKey>(
    value: T,
    fieldPath = "ApiKey",
  ): Result<FApiKey, ExceptionValidation> {
    const typed = FApiKey.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FApiKey(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.assignLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static generate(): FApiKey {
    return FApiKey.createOrThrow(uuidv4(), "ApiKey");
  }

  static generateString(): string {
    return uuidv4();
  }

  static isValid(value: string): boolean {
    return validate(value) && version(value) === 4;
  }

  toSafeDisplay(): string {
    const value = this.getValue();
    const segments = value.split("-");

    if (segments.length !== 5) {
      return "****-****-****-****-************";
    }

    return `${segments[0]}-****-****-****-${segments[4]}`;
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "API key in UUID v4 format for client application authentication.";
  }

  override getShortDescription(): string {
    return "API Key (UUID v4)";
  }
}
