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
import { TypeField } from "./type-field.base";
import { ITypeFieldConfig } from "./type-field.config";

export type TDate = Date;
export type TDateFormatted = string;
export type TfDate = TDateFormatted;

/**
 * Base abstrata para formatos de Date.
 */
export abstract class FDate extends TypeField<TDate, TDateFormatted> {
  /** JSON schema tipo Date */
  static readonly config: ITypeFieldConfig<TDate> = { jsonSchemaType: "Date" };
  override get config(): ITypeFieldConfig<TDate> {
    return FDate.config;
  }

  protected constructor(value: TDate, fieldPath: string) {
    super(value, fieldPath);
  }

  /** Deve ser implementado pelas subclasses usando ToolFormattingDateISO8601 */
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
// ISO8601 Zulu com milissegundos: YYYY-MM-DDTHH:mm:ss.sssZ
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

  protected override validate(
    value: TDate,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const result = FDateTimeISOZMillis.validateRaw(value, fieldPath);
    if (!result.success) return err(result.error);
    return OK_TRUE;
  }

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateTimeZuluWithMillis(date);

  static validateRaw(value: unknown, fieldPath: string): Result<Date, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateTimeZuluWithMillis(value);
    if (isFailure(parsed)) {
      return err(ExceptionValidation.create(fieldPath, parsed.error.detail));
    }
    return ok(parsed.value);
  }

  static create(
    raw: string | Date,
    fieldPath = "FDateTimeISOZMillis",
  ): Result<FDateTimeISOZMillis, ExceptionValidation> {
    const validation = FDateTimeISOZMillis.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FDateTimeISOZMillis(validation.value, fieldPath));
  }

  static createOrThrow(date: Date, fieldPath = "FDateTimeISOZMillis"): FDateTimeISOZMillis {
    const result = this.create(date, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
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
// ISO8601 data (sem hora): YYYY-MM-DD
// ============================================================================
export class FDateISODate extends FDate {
  override readonly typeInference = "FDateISODate";

  override get config(): ITypeFieldConfig<TDate> {
    return DATE_CONFIG_SERIALIZE;
  }

  private constructor(value: TDate, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validate(
    value: TDate,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const result = FDateISODate.validateRaw(value, fieldPath);
    if (!result.success) return err(result.error);
    return OK_TRUE;
  }

  protected formatValue = (date: Date): string => {
    const result = ToolFormattingDateISO8601.formatDate(date);
    if (!result.success) throw result.error;
    return result.value;
  };

  static validateRaw(value: unknown, fieldPath: string): Result<Date, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDate(value);
    if (isFailure(parsed)) {
      return err(ExceptionValidation.create(fieldPath, parsed.error.detail));
    }
    return ok(parsed.value);
  }

  static create(
    raw: string | Date,
    fieldPath = "FDateISODate",
  ): Result<FDateISODate, ExceptionValidation> {
    const validation = FDateISODate.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FDateISODate(validation.value, fieldPath));
  }

  static createOrThrow(raw: string | Date, fieldPath = "FDateISODate"): FDateISODate {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }
}

// ============================================================================
// ISO8601 sem milissegundos (UTC): YYYY-MM-DDTHH:mm:ssZ
// ============================================================================
export class FDateTimeISOZ extends FDate {
  override readonly typeInference = "FDateTimeISOZ";

  override get config(): ITypeFieldConfig<TDate> {
    return DATE_CONFIG_SERIALIZE;
  }

  private constructor(value: TDate, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validate(
    value: TDate,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const result = FDateTimeISOZ.validateRaw(value, fieldPath);
    if (!result.success) return err(result.error);
    return OK_TRUE;
  }

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateTimeUTC(date);

  static validateRaw(value: unknown, fieldPath: string): Result<Date, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateTimeUTC(value);
    if (isFailure(parsed)) {
      return err(ExceptionValidation.create(fieldPath, parsed.error.detail));
    }
    return ok(parsed.value);
  }

  static create(
    raw: string | Date,
    fieldPath = "FDateTimeISOZ",
  ): Result<FDateTimeISOZ, ExceptionValidation> {
    const validation = FDateTimeISOZ.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FDateTimeISOZ(validation.value, fieldPath));
  }

  static createOrThrow(raw: string | Date, fieldPath = "FDateTimeISOZ"): FDateTimeISOZ {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  static generateDateString(date: Date = new Date()): string {
    return date.toISOString().replace(/\.\d{3}Z$/, "Z");
  }
}

// ============================================================================
// ISO8601 compacto (YYYYMMDD)
// ============================================================================
export class FDateISOCompact extends FDate {
  override readonly typeInference = "FDateISOCompact";

  override get config(): ITypeFieldConfig<TDate> {
    return DATE_CONFIG_SERIALIZE;
  }

  private constructor(value: TDate, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validate(
    value: TDate,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const result = FDateISOCompact.validateRaw(value, fieldPath);
    if (!result.success) return err(result.error);
    return OK_TRUE;
  }

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateCompact(date);

  static validateRaw(value: unknown, fieldPath: string): Result<Date, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateCompact(value);
    if (isFailure(parsed)) {
      return err(ExceptionValidation.create(fieldPath, parsed.error.detail));
    }
    return ok(parsed.value);
  }

  static create(
    raw: string | Date,
    fieldPath = "FDateISOCompact",
  ): Result<FDateISOCompact, ExceptionValidation> {
    const validation = FDateISOCompact.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FDateISOCompact(validation.value, fieldPath));
  }

  static createOrThrow(raw: string | Date, fieldPath = "FDateISOCompact"): FDateISOCompact {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }
}

// ============================================================================
// ISO8601 compacto com T (YYYYMMDDTHH:mm:ss)
// ============================================================================
export class FDateTimeISOCompact extends FDate {
  override readonly typeInference = "FDateTimeISOCompact";

  override get config(): ITypeFieldConfig<TDate> {
    return DATE_CONFIG_SERIALIZE;
  }

  private constructor(value: TDate, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validate(
    value: TDate,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const result = FDateTimeISOCompact.validateRaw(value, fieldPath);
    if (!result.success) return err(result.error);
    return OK_TRUE;
  }

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateTimeCompactWithT(date);

  static validateRaw(value: unknown, fieldPath: string): Result<Date, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateTimeCompactWithT(value);
    if (isFailure(parsed)) {
      return err(ExceptionValidation.create(fieldPath, parsed.error.detail));
    }
    return ok(parsed.value);
  }

  static create(
    raw: string | Date,
    fieldPath = "FDateTimeISOCompact",
  ): Result<FDateTimeISOCompact, ExceptionValidation> {
    const validation = FDateTimeISOCompact.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FDateTimeISOCompact(validation.value, fieldPath));
  }

  static createOrThrow(raw: string | Date, fieldPath = "FDateTimeISOCompact"): FDateTimeISOCompact {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }
}

// ============================================================================
// ISO8601 full compacto (YYYYMMDDHHmmss)
// ============================================================================
export class FDateTimeISOFullCompact extends FDate {
  override readonly typeInference = "FDateTimeISOFullCompact";

  override get config(): ITypeFieldConfig<TDate> {
    return DATE_CONFIG_SERIALIZE;
  }

  private constructor(value: TDate, fieldPath: string) {
    super(value, fieldPath);
  }

  protected override validate(
    value: TDate,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const result = FDateTimeISOFullCompact.validateRaw(value, fieldPath);
    if (!result.success) return err(result.error);
    return OK_TRUE;
  }

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateTimeCompact(date);

  static validateRaw(value: unknown, fieldPath: string): Result<Date, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateTimeFullCompact(value);
    if (isFailure(parsed)) {
      return err(ExceptionValidation.create(fieldPath, parsed.error.detail));
    }
    return ok(parsed.value);
  }

  static create(
    raw: string | Date,
    fieldPath = "FDateTimeISOFullCompact",
  ): Result<FDateTimeISOFullCompact, ExceptionValidation> {
    const validation = FDateTimeISOFullCompact.validateRaw(raw, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FDateTimeISOFullCompact(validation.value, fieldPath));
  }

  static createOrThrow(raw: string | Date, fieldPath = "FDateTimeISOFullCompact"): FDateTimeISOFullCompact {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }
}
