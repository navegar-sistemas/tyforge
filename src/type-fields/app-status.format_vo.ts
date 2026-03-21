import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";

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

  static validateRaw(value: unknown, fieldPath: string): Result<true, ExceptionValidation> {
    const resolved = FAppStatus.resolveEnum(OAppStatus, value, fieldPath);
    if (!resolved.success) return err(resolved.error);
    return OK_TRUE;
  }

  static create(
    raw: TAppStatus,
    fieldPath = "AppStatus",
  ): Result<FAppStatus, ExceptionValidation> {
    const validation = FAppStatus.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FAppStatus(raw, fieldPath));
  }

  static createOrThrow(
    raw: TAppStatus,
    fieldPath = "AppStatus",
  ): FAppStatus {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
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

  override validate(
    value: TAppStatus,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FAppStatus.validateRaw(value, fieldPath);
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
