import { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { FIdentifier, TIdentifier } from "../identity/identifier.typefield";
import { validate as uuidValidate } from "uuid";

export type TTransactionId = TIdentifier;
export type TTransactionIdFormatted = string;

export class FTransactionId extends FIdentifier {
  override readonly typeInference = "FTransactionId";

  override readonly config: ITypeFieldConfig<TTransactionId> = {
    jsonSchemaType: "string",
    minLength: 36,
    maxLength: 36,
    serializeAsString: false,
  };

  private constructor(value: TTransactionId, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TTransactionId,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!uuidValidate(value)) {
      return err(ExceptionValidation.create(fieldPath, "Transaction ID must be a valid UUID"));
    }
    return OK_TRUE;
  }

  static create<T = TTransactionId>(raw: T, fieldPath = "TransactionId"): Result<FTransactionId, ExceptionValidation> {
    const typed = FIdentifier.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FTransactionId(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TTransactionId, fieldPath = "TransactionId"): FTransactionId {
    const result = FTransactionId.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TTransactionId>(value: T, fieldPath = "TransactionId"): Result<FTransactionId, ExceptionValidation> {
    const typed = FIdentifier.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FTransactionId(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static generate(fieldPath = "TransactionId"): FTransactionId {
    return FTransactionId.createOrThrow(FIdentifier.generateId(), fieldPath);
  }

  override getDescription(): string {
    return "Unique transaction identifier (UUID).";
  }

  override getShortDescription(): string {
    return "Transaction ID";
  }
}
