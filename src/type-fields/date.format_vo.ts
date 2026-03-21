import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { ExceptionDate } from "@tyforge/exceptions/date.exception";
import {
  Result,
  ok,
  err,
  isFailure,
} from "@tyforge/result/result";
import { ToolFormattingDateISO8601 } from "@tyforge/tools/formatting/date/date-formatting.tool";
import { ToolParse } from "@tyforge/tools/parse/parse.tool";
import { TypeField } from "./type-field.base";
import { ITypeFieldConfig } from "./type-field.config";

export type TDate = Date;
export type TfDate = string;

/**
 * Base abstrata para formatos de Date.
 */
export abstract class FDate extends TypeField<TDate> {
  /** JSON schema tipo Date */
  static readonly config: ITypeFieldConfig<TDate> = { jsonSchemaType: "Date" };
  override get config(): ITypeFieldConfig<TDate> {
    return (this.constructor as typeof FDate).config;
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
export class FDateTimeISOZMillis extends FDate {
  override readonly typeInference = "FDateTimeISOZMillis";

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateTimeZuluWithMillis(date);

  static create(
    raw: string | Date,
    fieldPath = "FDateTimeISOZMillis",
  ): Result<FDateTimeISOZMillis, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateTimeZuluWithMillis(raw);
    if (isFailure(parsed)) {
      return err(ExceptionValidation.create(fieldPath, (parsed.error as ExceptionDate).detail));
    }
    const inst = new FDateTimeISOZMillis(parsed.value, fieldPath);
    const validation = inst.validate(parsed.value, fieldPath);
    return isFailure(validation) ? err(validation.error) : ok(inst);
  }

  static createOrThrow(date: Date): FDateTimeISOZMillis {
    const result = this.create(date);
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

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDate(date);

  static create(
    raw: string | Date,
    fieldPath = "FDateISODate",
  ): Result<FDateISODate, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDate(raw);
    if (isFailure(parsed)) {
      return err(ExceptionValidation.create(fieldPath, (parsed.error as ExceptionDate).detail));
    }
    const inst = new FDateISODate(parsed.value, fieldPath);
    const validation = inst.validate(parsed.value, fieldPath);
    return isFailure(validation) ? err(validation.error) : ok(inst);
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

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateTimeUTC(date);

  static create(
    raw: string | Date,
    fieldPath = "FDateTimeISOZ",
  ): Result<FDateTimeISOZ, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateTimeUTC(raw);
    if (isFailure(parsed)) {
      return err(ExceptionValidation.create(fieldPath, (parsed.error as ExceptionDate).detail));
    }
    const inst = new FDateTimeISOZ(parsed.value, fieldPath);
    const validation = inst.validate(parsed.value, fieldPath);
    return isFailure(validation) ? err(validation.error) : ok(inst);
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

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateCompact(date);

  static create(
    raw: string | Date,
    fieldPath = "FDateISOCompact",
  ): Result<FDateISOCompact, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateCompact(raw);
    if (isFailure(parsed)) {
      return err(ExceptionValidation.create(fieldPath, (parsed.error as ExceptionDate).detail));
    }
    const inst = new FDateISOCompact(parsed.value, fieldPath);
    const validation = inst.validate(parsed.value, fieldPath);
    return isFailure(validation) ? err(validation.error) : ok(inst);
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

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateTimeCompactWithT(date);

  static create(
    raw: string | Date,
    fieldPath = "FDateTimeISOCompact",
  ): Result<FDateTimeISOCompact, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateTimeCompactWithT(raw);
    if (isFailure(parsed)) {
      return err(ExceptionValidation.create(fieldPath, (parsed.error as ExceptionDate).detail));
    }
    const inst = new FDateTimeISOCompact(parsed.value, fieldPath);
    const validation = inst.validate(parsed.value, fieldPath);
    return isFailure(validation) ? err(validation.error) : ok(inst);
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

  protected formatValue = (date: Date): string =>
    ToolFormattingDateISO8601.formatDateTimeCompact(date);

  static create(
    raw: string | Date,
    fieldPath = "FDateTimeISOFullCompact",
  ): Result<FDateTimeISOFullCompact, ExceptionValidation> {
    const parsed = ToolParse.dateISO8601.parseDateTimeFullCompact(raw);
    if (isFailure(parsed)) {
      return err(ExceptionValidation.create(fieldPath, (parsed.error as ExceptionDate).detail));
    }
    const inst = new FDateTimeISOFullCompact(parsed.value, fieldPath);
    const validation = inst.validate(parsed.value, fieldPath);
    return isFailure(validation) ? err(validation.error) : ok(inst);
  }

  static createOrThrow(raw: string | Date, fieldPath = "FDateTimeISOFullCompact"): FDateTimeISOFullCompact {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }
}
