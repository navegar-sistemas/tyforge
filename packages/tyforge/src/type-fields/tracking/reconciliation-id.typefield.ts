import { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { FIdentifier, TIdentifier } from "../identity/identifier.typefield";

export type TReconciliationId = TIdentifier;
export type TReconciliationIdFormatted = string;

const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;

export class FReconciliationId extends FIdentifier {
  override readonly typeInference = "FReconciliationId";

  override readonly config: ITypeFieldConfig<TReconciliationId> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 35,
    serializeAsString: false,
  };

  private constructor(value: TReconciliationId, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TReconciliationId,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!ALPHANUMERIC_REGEX.test(value)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "Reconciliation ID must contain only alphanumeric characters",
        ),
      );
    }
    return OK_TRUE;
  }

  static create<T = TReconciliationId>(
    raw: T,
    fieldPath = "ReconciliationId",
  ): Result<FReconciliationId, ExceptionValidation> {
    const typed = FIdentifier.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FReconciliationId(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(
    raw: TReconciliationId,
    fieldPath = "ReconciliationId",
  ): FReconciliationId {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TReconciliationId>(
    value: T,
    fieldPath = "ReconciliationId",
  ): Result<FReconciliationId, ExceptionValidation> {
    const typed = FReconciliationId.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FReconciliationId(typed.value, fieldPath);
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

  override formatted(): TReconciliationIdFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return (
      "Reconciliation identifier for payment" +
      " matching" +
      " (alphanumeric, up to 35 characters)."
    );
  }

  override getShortDescription(): string {
    return "Reconciliation ID";
  }
}
