import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const OMaritalStatus = {
  SINGLE: "SINGLE",
  MARRIED: "MARRIED",
  DIVORCED: "DIVORCED",
  WIDOWED: "WIDOWED",
  COMMON_LAW: "COMMON_LAW",
} as const;

export type TKeyMaritalStatus = keyof typeof OMaritalStatus;
export type TMaritalStatus = (typeof OMaritalStatus)[TKeyMaritalStatus];
export type TMaritalStatusFormatted = string;

export class FMaritalStatus extends TypeField<
  TMaritalStatus,
  TMaritalStatusFormatted
> {
  override readonly typeInference = "FMaritalStatus";

  override readonly config: ITypeFieldConfig<TMaritalStatus> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 20,
    validateEnum: OMaritalStatus,
    serializeAsString: false,
  };

  private constructor(value: TMaritalStatus, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(
    value: unknown,
    fieldPath: string,
  ): Result<TMaritalStatus, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    return TypeField.resolveEnum(OMaritalStatus, str.value, fieldPath);
  }

  static create<T = TMaritalStatus>(
    raw: T,
    fieldPath = "MaritalStatus",
  ): Result<FMaritalStatus, ExceptionValidation> {
    const typed = FMaritalStatus.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FMaritalStatus(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(
    raw: TMaritalStatus,
    fieldPath = "MaritalStatus",
  ): FMaritalStatus {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TMaritalStatus>(
    value: T,
    fieldPath = "MaritalStatus",
  ): Result<FMaritalStatus, ExceptionValidation> {
    const typed = FMaritalStatus.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FMaritalStatus(typed.value, fieldPath);
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

  override formatted(): TMaritalStatusFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Marital status.";
  }

  override getShortDescription(): string {
    return "Marital status";
  }
}
