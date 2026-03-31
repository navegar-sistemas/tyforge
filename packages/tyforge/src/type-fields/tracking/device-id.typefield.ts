import { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { FIdentifier, TIdentifier } from "../identity/identifier.typefield";
import { validate as uuidValidate } from "uuid";

export type TDeviceId = TIdentifier;
export type TDeviceIdFormatted = string;

export class FDeviceId extends FIdentifier {
  override readonly typeInference = "FDeviceId";

  override readonly config: ITypeFieldConfig<TDeviceId> = {
    jsonSchemaType: "string",
    minLength: 36,
    maxLength: 36,
    serializeAsString: false,
  };

  private constructor(value: TDeviceId, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validateRules(
    value: TDeviceId,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    const base = super.validateRules(value, fieldPath, validateLevel);
    if (!base.success) return base;
    if (validateLevel !== "full") return OK_TRUE;
    if (!uuidValidate(value)) {
      return err(
        ExceptionValidation.create(fieldPath, "Device ID must be a valid UUID"),
      );
    }
    return OK_TRUE;
  }

  static create<T = TDeviceId>(
    raw: T,
    fieldPath = "DeviceId",
  ): Result<FDeviceId, ExceptionValidation> {
    const typed = FIdentifier.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDeviceId(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(raw: TDeviceId, fieldPath = "DeviceId"): FDeviceId {
    const result = FDeviceId.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDeviceId>(
    value: T,
    fieldPath = "DeviceId",
  ): Result<FDeviceId, ExceptionValidation> {
    const typed = FIdentifier.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FDeviceId(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.assignLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static generate(fieldPath = "DeviceId"): FDeviceId {
    return FDeviceId.createOrThrow(FIdentifier.generateId(), fieldPath);
  }

  override getDescription(): string {
    return "Device identifier (UUID).";
  }

  override getShortDescription(): string {
    return "Device ID";
  }
}
