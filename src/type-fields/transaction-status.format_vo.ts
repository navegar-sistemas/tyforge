import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const OTransactionStatus = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  FAILED: "FAILED",
  CANCELED: "CANCELED",
  PROCESSING: "PROCESSING",
} as const;

export type TKeyTransactionStatus = keyof typeof OTransactionStatus;
export type TTransactionStatus = (typeof OTransactionStatus)[TKeyTransactionStatus];
export type TTransactionStatusFormatted = string;

export class FTransactionStatus extends TypeField<TTransactionStatus, TTransactionStatusFormatted> {
  override readonly typeInference = "FTransactionStatus";

  override readonly config: ITypeFieldConfig<TTransactionStatus> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 20,
    validateEnum: OTransactionStatus,
    serializeAsString: false,
  };

  private constructor(value: TTransactionStatus, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath: string): Result<TTransactionStatus, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    return TypeField.resolveEnum(OTransactionStatus, str.value, fieldPath);
  }

  static create<T = TTransactionStatus>(raw: T, fieldPath = "TransactionStatus"): Result<FTransactionStatus, ExceptionValidation> {
    const typed = FTransactionStatus.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FTransactionStatus(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TTransactionStatus, fieldPath = "TransactionStatus"): FTransactionStatus {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TTransactionStatus>(value: T, fieldPath = "TransactionStatus"): Result<FTransactionStatus, ExceptionValidation> {
    const typed = FTransactionStatus.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FTransactionStatus(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): TTransactionStatusFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Transaction processing status.";
  }

  override getShortDescription(): string {
    return "Transaction status";
  }
}
