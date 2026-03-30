import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export const OAppStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type TKeyAppStatus = keyof typeof OAppStatus;
export type TAppStatus = (typeof OAppStatus)[TKeyAppStatus];
export type TAppStatusFormatted = string;

export class FAppStatus extends TypeField<TAppStatus, TAppStatusFormatted> {
  override readonly typeInference = "FAppStatus";

  override readonly config: ITypeFieldConfig<TAppStatus> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 10,
    validateEnum: OAppStatus,
    serializeAsString: false,
  };

  private constructor(value: TAppStatus, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(value: unknown, fieldPath: string): Result<TAppStatus, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    return TypeField.resolveEnum(OAppStatus, str.value, fieldPath);
  }

  static create<T = TAppStatus>(raw: T, fieldPath = "AppStatus"): Result<FAppStatus, ExceptionValidation> {
    const typed = FAppStatus.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FAppStatus(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.createLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TAppStatus, fieldPath = "AppStatus"): FAppStatus {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TAppStatus>(value: T, fieldPath = "AppStatus"): Result<FAppStatus, ExceptionValidation> {
    const typed = FAppStatus.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FAppStatus(typed.value, fieldPath);
    const rules = instance.validateRules(typed.value, fieldPath, TypeField.assignLevel);
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static fromBoolean(isActive: boolean): FAppStatus {
    const status = isActive
      ? OAppStatus.ACTIVE
      : OAppStatus.INACTIVE;
    return FAppStatus.createOrThrow(status, "AppStatus");
  }

  static generate(): FAppStatus {
    return FAppStatus.createOrThrow(OAppStatus.ACTIVE, "AppStatus");
  }

  isActive(): boolean {
    return this.getValue() === OAppStatus.ACTIVE;
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Status da aplicacao no sistema. ACTIVE indica aplicacao operacional, INACTIVE indica aplicacao desativada.";
  }

  override getShortDescription(): string {
    return "Status da aplicacao";
  }
}
