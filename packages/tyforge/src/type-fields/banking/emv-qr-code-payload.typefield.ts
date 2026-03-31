import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/_base/type-field.config";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";

export type TEmvQrCodePayload = string;
export type TEmvQrCodePayloadFormatted = string;

export class FEmvQrCodePayload extends TypeField<
  TEmvQrCodePayload,
  TEmvQrCodePayloadFormatted
> {
  override readonly typeInference = "FEmvQrCodePayload";

  override readonly config: ITypeFieldConfig<TEmvQrCodePayload> = {
    jsonSchemaType: "string",
    minLength: 1,
    maxLength: 1000,
    serializeAsString: false,
  };

  private constructor(value: TEmvQrCodePayload, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateType(
    value: unknown,
    fieldPath: string,
  ): Result<TEmvQrCodePayload, ExceptionValidation> {
    return TypeGuard.isString(value, fieldPath);
  }

  static create<T = TEmvQrCodePayload>(
    raw: T,
    fieldPath = "EmvQrCodePayload",
  ): Result<FEmvQrCodePayload, ExceptionValidation> {
    const typed = FEmvQrCodePayload.validateType(raw, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FEmvQrCodePayload(typed.value, fieldPath);
    const rules = instance.validateRules(
      typed.value,
      fieldPath,
      TypeField.createLevel,
    );
    if (!rules.success) return err(rules.error);
    return ok(instance);
  }

  static createOrThrow(
    raw: TEmvQrCodePayload,
    fieldPath = "EmvQrCodePayload",
  ): FEmvQrCodePayload {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TEmvQrCodePayload>(
    value: T,
    fieldPath = "EmvQrCodePayload",
  ): Result<FEmvQrCodePayload, ExceptionValidation> {
    const typed = FEmvQrCodePayload.validateType(value, fieldPath);
    if (isFailure(typed)) return err(typed.error);
    const instance = new FEmvQrCodePayload(typed.value, fieldPath);
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

  override formatted(): TEmvQrCodePayloadFormatted {
    return String(this.getValue());
  }

  override getDescription(): string {
    return (
      "EMV QR Code payload — encoded string " +
      "containing payment data (merchant, amount, " +
      "currency) for instant payment processing."
    );
  }

  override getShortDescription(): string {
    return "EMV QR Code payload";
  }
}
