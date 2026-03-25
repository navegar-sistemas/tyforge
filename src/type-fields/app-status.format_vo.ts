import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
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

  static create<T = TAppStatus>(raw: T, fieldPath = "AppStatus"): Result<FAppStatus, ExceptionValidation> {
    const str = TypeGuard.isString(raw, fieldPath);
    if (isFailure(str)) return err(str.error);
    const enumResult = TypeField.resolveEnum(OAppStatus, str.value, fieldPath);
    if (isFailure(enumResult)) return err(enumResult.error);
    const value = TypeField.normalize(enumResult.value, TypeField.createLevel);
    const instance = new FAppStatus(value, fieldPath);
    const validation = instance.validate(value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: TAppStatus, fieldPath = "AppStatus"): FAppStatus {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TAppStatus>(value: T, fieldPath = "AppStatus"): Result<FAppStatus, ExceptionValidation> {
    const str = TypeGuard.isString(value, fieldPath);
    if (isFailure(str)) return err(str.error);
    const enumResult = TypeField.resolveEnum(OAppStatus, str.value, fieldPath);
    if (isFailure(enumResult)) return err(enumResult.error);
    const normalized = TypeField.normalize(enumResult.value, TypeField.assignLevel);
    const instance = new FAppStatus(normalized, fieldPath);
    const validation = instance.validate(normalized, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
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
