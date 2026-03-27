import { TValidationLevel } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeField } from "@tyforge/type-fields/type-field.base";
import { FIdentifier, TIdentifier } from "./identifier.format_vo";
import { validate as uuidValidate } from "uuid";

export type TId = TIdentifier;
export type TIdFormatted = string;

export class FId extends FIdentifier {
  override readonly typeInference = "FId";

  override readonly config: ITypeFieldConfig<TId> = {
    jsonSchemaType: "string",
    minLength: 36,
    maxLength: 36,
    serializeAsString: false,
  };

  private constructor(value: TId, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TId,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!uuidValidate(value)) {
      return err(ExceptionValidation.create(fieldPath, "ID must be a valid UUID"));
    }
    return OK_TRUE;
  }

  static create<T = TId>(raw: T, fieldPath = "Id"): Result<FId, ExceptionValidation> {
    const typed = FIdentifier.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FId(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TId, fieldPath = "Id"): FId {
    const result = FId.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TId>(value: T, fieldPath = "Id"): Result<FId, ExceptionValidation> {
    const typed = FIdentifier.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FId(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static generate(fieldPath = "Id"): FId {
    return new FId(FIdentifier.generateId(), fieldPath);
  }

  override getDescription(): string {
    return "Unique identifier (UUID). Primary key for entities and aggregates.";
  }

  override getShortDescription(): string {
    return "ID";
  }
}
