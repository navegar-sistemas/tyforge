import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import {
  Result,
  ok,
  err,
  isFailure,
  OK_TRUE,
} from "@tyforge/result/result";
import { ToolFormattingDateISO8601 } from "@tyforge/tools/formatting/date/date-formatting.tool";
import { ToolParse } from "@tyforge/tools/parse/parse.tool";
import { TypeField, TValidationLevel } from "./type-field.base";
import { ITypeFieldConfig } from "./type-field.config";

export type TDate = Date;
export type TDateFormatted = string;
export type TfDate = TDateFormatted;

/**
 * Abstract base for Date formats.
 */
export abstract class FDate extends TypeField<TDate, TDateFormatted> {
  /** JSON schema type: Date */
  static readonly config: ITypeFieldConfig<TDate> = { jsonSchemaType: "Date" };
  override get config(): ITypeFieldConfig<TDate> {
    return FDate.config;
  }

  protected constructor(value: TDate, fieldPath: string) {
    super(value, fieldPath);
  }

  /** Must be implemented by subclasses using ToolFormattingDateISO8601 */
  protected abstract formatValue(date: Date): string;

  override toString(): string {
    return this.formatValue(this.getValue());
  }
  override getDescription(): string {
    return this.toString();
  }
  override getShortDescription(): string {
    return this.toString();
  }
  override formatted(): TfDate {
    return this.toString();
  }
}

// ============================================================================
// ISO8601 Zulu with milliseconds: YYYY-MM-DDTHH:mm:ss.sssZ
// ============================================================================
const DATE_CONFIG_SERIALIZE: ITypeFieldConfig<TDate> = {
  jsonSchemaType: "Date",
  serializeAsString: false,
};

export class FDateTimeISOZMillis extends FDate {
  override readonly typeInference = "FDateTimeISOZMillis";

  override get config(): ITypeFieldConfig<TDate> {
    return DATE_CONFIG_SERIALIZE;
  }

  private constructor(value: TDate, fieldPath: string) {
    super(value, fieldPath);
  }

  private static parse(value: unknown, fieldPath: string): Result<Date, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateTimeZuluWithMillis(value);
    if (isFailure(parsed)) return err(ExceptionValidation.create(fieldPath, parsed.error.detail));
    return ok(parsed.value);
  }

  protected override validate(
    value: TDate,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    if (validateLevel === "none") return OK_TRUE;
    if (validateLevel === "type") return super.validate(value, fieldPath, validateLevel);
    const result = FDateTimeISOZMillis.parse(value, fieldPath);
    if (!result.success) return err(result.error);
    return OK_TRUE;
  }

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateTimeZuluWithMillis(date);

  static create<T = string | Date>(
    raw: T,
    fieldPath = "FDateTimeISOZMillis",
  ): Result<FDateTimeISOZMillis, ExceptionValidation> {
    const parsed = FDateTimeISOZMillis.parse(raw, fieldPath);
    if (!parsed.success) return err(parsed.error);
    const instance = new FDateTimeISOZMillis(parsed.value, fieldPath);
    const validation = instance.validate(parsed.value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(date: Date, fieldPath = "FDateTimeISOZMillis"): FDateTimeISOZMillis {
    const result = this.create(date, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDate>(value: T, fieldPath = "FDateTimeISOZMillis"): Result<FDateTimeISOZMillis, ExceptionValidation> {
    const parsed = FDateTimeISOZMillis.parse(value, fieldPath);
    if (!parsed.success) return err(parsed.error);
    const instance = new FDateTimeISOZMillis(parsed.value, fieldPath);
    const validation = instance.validate(parsed.value, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static generateToString(date: Date = new Date()): string {
    return date.toISOString();
  }

  static generate(): FDateTimeISOZMillis {
    const result = this.create(new Date());
    if (isFailure(result)) throw result.error;
    return result.value;
  }
}

// ============================================================================
// ISO8601 date (no time): YYYY-MM-DD
// ============================================================================
export class FDateISODate extends FDate {
  override readonly typeInference = "FDateISODate";

  override get config(): ITypeFieldConfig<TDate> {
    return DATE_CONFIG_SERIALIZE;
  }

  private constructor(value: TDate, fieldPath: string) {
    super(value, fieldPath);
  }

  private static parse(value: unknown, fieldPath: string): Result<Date, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDate(value);
    if (isFailure(parsed)) return err(ExceptionValidation.create(fieldPath, parsed.error.detail));
    return ok(parsed.value);
  }

  protected override validate(
    value: TDate,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    if (validateLevel === "none") return OK_TRUE;
    if (validateLevel === "type") return super.validate(value, fieldPath, validateLevel);
    const result = FDateISODate.parse(value, fieldPath);
    if (!result.success) return err(result.error);
    return OK_TRUE;
  }

  protected formatValue = (date: Date): string => {
    const result = ToolFormattingDateISO8601.formatDate(date);
    if (!result.success) throw result.error;
    return result.value;
  };

  static create<T = string | Date>(
    raw: T,
    fieldPath = "FDateISODate",
  ): Result<FDateISODate, ExceptionValidation> {
    const parsed = FDateISODate.parse(raw, fieldPath);
    if (!parsed.success) return err(parsed.error);
    const instance = new FDateISODate(parsed.value, fieldPath);
    const validation = instance.validate(parsed.value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: string | Date, fieldPath = "FDateISODate"): FDateISODate {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDate>(value: T, fieldPath = "FDateISODate"): Result<FDateISODate, ExceptionValidation> {
    const parsed = FDateISODate.parse(value, fieldPath);
    if (!parsed.success) return err(parsed.error);
    const instance = new FDateISODate(parsed.value, fieldPath);
    const validation = instance.validate(parsed.value, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }
}

// ============================================================================
// ISO8601 without milliseconds (UTC): YYYY-MM-DDTHH:mm:ssZ
// ============================================================================
export class FDateTimeISOZ extends FDate {
  override readonly typeInference = "FDateTimeISOZ";

  override get config(): ITypeFieldConfig<TDate> {
    return DATE_CONFIG_SERIALIZE;
  }

  private constructor(value: TDate, fieldPath: string) {
    super(value, fieldPath);
  }

  private static parse(value: unknown, fieldPath: string): Result<Date, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateTimeUTC(value);
    if (isFailure(parsed)) return err(ExceptionValidation.create(fieldPath, parsed.error.detail));
    return ok(parsed.value);
  }

  protected override validate(
    value: TDate,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    if (validateLevel === "none") return OK_TRUE;
    if (validateLevel === "type") return super.validate(value, fieldPath, validateLevel);
    const result = FDateTimeISOZ.parse(value, fieldPath);
    if (!result.success) return err(result.error);
    return OK_TRUE;
  }

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateTimeUTC(date);

  static create<T = string | Date>(
    raw: T,
    fieldPath = "FDateTimeISOZ",
  ): Result<FDateTimeISOZ, ExceptionValidation> {
    const parsed = FDateTimeISOZ.parse(raw, fieldPath);
    if (!parsed.success) return err(parsed.error);
    const instance = new FDateTimeISOZ(parsed.value, fieldPath);
    const validation = instance.validate(parsed.value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: string | Date, fieldPath = "FDateTimeISOZ"): FDateTimeISOZ {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDate>(value: T, fieldPath = "FDateTimeISOZ"): Result<FDateTimeISOZ, ExceptionValidation> {
    const parsed = FDateTimeISOZ.parse(value, fieldPath);
    if (!parsed.success) return err(parsed.error);
    const instance = new FDateTimeISOZ(parsed.value, fieldPath);
    const validation = instance.validate(parsed.value, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static generateDateString(date: Date = new Date()): string {
    return date.toISOString().replace(/\.\d{3}Z$/, "Z");
  }
}

// ============================================================================
// ISO8601 compact (YYYYMMDD)
// ============================================================================
export class FDateISOCompact extends FDate {
  override readonly typeInference = "FDateISOCompact";

  override get config(): ITypeFieldConfig<TDate> {
    return DATE_CONFIG_SERIALIZE;
  }

  private constructor(value: TDate, fieldPath: string) {
    super(value, fieldPath);
  }

  private static parse(value: unknown, fieldPath: string): Result<Date, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateCompact(value);
    if (isFailure(parsed)) return err(ExceptionValidation.create(fieldPath, parsed.error.detail));
    return ok(parsed.value);
  }

  protected override validate(
    value: TDate,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    if (validateLevel === "none") return OK_TRUE;
    if (validateLevel === "type") return super.validate(value, fieldPath, validateLevel);
    const result = FDateISOCompact.parse(value, fieldPath);
    if (!result.success) return err(result.error);
    return OK_TRUE;
  }

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateCompact(date);

  static create<T = string | Date>(
    raw: T,
    fieldPath = "FDateISOCompact",
  ): Result<FDateISOCompact, ExceptionValidation> {
    const parsed = FDateISOCompact.parse(raw, fieldPath);
    if (!parsed.success) return err(parsed.error);
    const instance = new FDateISOCompact(parsed.value, fieldPath);
    const validation = instance.validate(parsed.value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: string | Date, fieldPath = "FDateISOCompact"): FDateISOCompact {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDate>(value: T, fieldPath = "FDateISOCompact"): Result<FDateISOCompact, ExceptionValidation> {
    const parsed = FDateISOCompact.parse(value, fieldPath);
    if (!parsed.success) return err(parsed.error);
    const instance = new FDateISOCompact(parsed.value, fieldPath);
    const validation = instance.validate(parsed.value, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }
}

// ============================================================================
// ISO8601 compact with T (YYYYMMDDTHH:mm:ss)
// ============================================================================
export class FDateTimeISOCompact extends FDate {
  override readonly typeInference = "FDateTimeISOCompact";

  override get config(): ITypeFieldConfig<TDate> {
    return DATE_CONFIG_SERIALIZE;
  }

  private constructor(value: TDate, fieldPath: string) {
    super(value, fieldPath);
  }

  private static parse(value: unknown, fieldPath: string): Result<Date, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateTimeCompactWithT(value);
    if (isFailure(parsed)) return err(ExceptionValidation.create(fieldPath, parsed.error.detail));
    return ok(parsed.value);
  }

  protected override validate(
    value: TDate,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    if (validateLevel === "none") return OK_TRUE;
    if (validateLevel === "type") return super.validate(value, fieldPath, validateLevel);
    const result = FDateTimeISOCompact.parse(value, fieldPath);
    if (!result.success) return err(result.error);
    return OK_TRUE;
  }

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateTimeCompactWithT(date);

  static create<T = string | Date>(
    raw: T,
    fieldPath = "FDateTimeISOCompact",
  ): Result<FDateTimeISOCompact, ExceptionValidation> {
    const parsed = FDateTimeISOCompact.parse(raw, fieldPath);
    if (!parsed.success) return err(parsed.error);
    const instance = new FDateTimeISOCompact(parsed.value, fieldPath);
    const validation = instance.validate(parsed.value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: string | Date, fieldPath = "FDateTimeISOCompact"): FDateTimeISOCompact {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDate>(value: T, fieldPath = "FDateTimeISOCompact"): Result<FDateTimeISOCompact, ExceptionValidation> {
    const parsed = FDateTimeISOCompact.parse(value, fieldPath);
    if (!parsed.success) return err(parsed.error);
    const instance = new FDateTimeISOCompact(parsed.value, fieldPath);
    const validation = instance.validate(parsed.value, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }
}

// ============================================================================
// ISO8601 full compact (YYYYMMDDHHmmss)
// ============================================================================
export class FDateTimeISOFullCompact extends FDate {
  override readonly typeInference = "FDateTimeISOFullCompact";

  override get config(): ITypeFieldConfig<TDate> {
    return DATE_CONFIG_SERIALIZE;
  }

  private constructor(value: TDate, fieldPath: string) {
    super(value, fieldPath);
  }

  private static parse(value: unknown, fieldPath: string): Result<Date, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateTimeFullCompact(value);
    if (isFailure(parsed)) return err(ExceptionValidation.create(fieldPath, parsed.error.detail));
    return ok(parsed.value);
  }

  protected override validate(
    value: TDate,
    fieldPath: string,
    validateLevel: TValidationLevel = "full",
  ): Result<true, ExceptionValidation> {
    if (validateLevel === "none") return OK_TRUE;
    if (validateLevel === "type") return super.validate(value, fieldPath, validateLevel);
    const result = FDateTimeISOFullCompact.parse(value, fieldPath);
    if (!result.success) return err(result.error);
    return OK_TRUE;
  }

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateTimeCompact(date);

  static create<T = string | Date>(
    raw: T,
    fieldPath = "FDateTimeISOFullCompact",
  ): Result<FDateTimeISOFullCompact, ExceptionValidation> {
    const parsed = FDateTimeISOFullCompact.parse(raw, fieldPath);
    if (!parsed.success) return err(parsed.error);
    const instance = new FDateTimeISOFullCompact(parsed.value, fieldPath);
    const validation = instance.validate(parsed.value, fieldPath, TypeField.createLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }

  static createOrThrow(raw: string | Date, fieldPath = "FDateTimeISOFullCompact"): FDateTimeISOFullCompact {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static assign<T = TDate>(value: T, fieldPath = "FDateTimeISOFullCompact"): Result<FDateTimeISOFullCompact, ExceptionValidation> {
    const parsed = FDateTimeISOFullCompact.parse(value, fieldPath);
    if (!parsed.success) return err(parsed.error);
    const instance = new FDateTimeISOFullCompact(parsed.value, fieldPath);
    const validation = instance.validate(parsed.value, fieldPath, TypeField.assignLevel);
    if (!validation.success) return err(validation.error);
    return ok(instance);
  }
}
