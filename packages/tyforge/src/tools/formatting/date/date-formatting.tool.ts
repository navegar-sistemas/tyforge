import { Result, ok, err } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions";

// 10800000ms = 3 hours, fixed UTC-3 offset for Brasília standard time
const UTC_MINUS_3_OFFSET_MS = 10800000;

export class ToolFormattingDateISO8601 {
  private static pad(num: number): string {
    return num.toString().padStart(2, "0");
  }

  private static toUTCMinus3(date: Date): Date {
    return new Date(date.getTime() - UTC_MINUS_3_OFFSET_MS);
  }

  /** @example "2024-04-09T18:00:00.123Z" */
  static formatDateTimeUTC(value: Date): string {
    return value.toISOString();
  }

  /** @example "2024-04-09T15:00:00" */
  static formatDateTime(value: Date): string {
    const d = ToolFormattingDateISO8601.toUTCMinus3(value);
    const year = d.getUTCFullYear();
    const month = ToolFormattingDateISO8601.pad(d.getUTCMonth() + 1);
    const day = ToolFormattingDateISO8601.pad(d.getUTCDate());
    const hours = ToolFormattingDateISO8601.pad(d.getUTCHours());
    const minutes = ToolFormattingDateISO8601.pad(d.getUTCMinutes());
    const seconds = ToolFormattingDateISO8601.pad(d.getUTCSeconds());
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  /** @example "2024-04-09" */
  static formatDate(value: Date): Result<string, ExceptionValidation> {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return err(
        ExceptionValidation.create("formatDate", "Invalid Date input"),
      );
    }
    const d = ToolFormattingDateISO8601.toUTCMinus3(value);
    const year = d.getUTCFullYear();
    const month = ToolFormattingDateISO8601.pad(d.getUTCMonth() + 1);
    const day = ToolFormattingDateISO8601.pad(d.getUTCDate());
    return ok(`${year}-${month}-${day}`);
  }

  /** @example "20240409" */
  static formatDateCompact(value: Date): string {
    const year = value.getUTCFullYear();
    const month = ToolFormattingDateISO8601.pad(value.getUTCMonth() + 1);
    const day = ToolFormattingDateISO8601.pad(value.getUTCDate());
    return `${year}${month}${day}`;
  }

  /** @example "20240409T153000" */
  static formatDateTimeCompactWithT(value: Date): string {
    const d = ToolFormattingDateISO8601.toUTCMinus3(value);
    const year = d.getUTCFullYear();
    const month = ToolFormattingDateISO8601.pad(d.getUTCMonth() + 1);
    const day = ToolFormattingDateISO8601.pad(d.getUTCDate());
    const hours = ToolFormattingDateISO8601.pad(d.getUTCHours());
    const minutes = ToolFormattingDateISO8601.pad(d.getUTCMinutes());
    const seconds = ToolFormattingDateISO8601.pad(d.getUTCSeconds());
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  }

  /** @example "20240409153000" */
  static formatDateTimeCompact(value: Date): string {
    const d = ToolFormattingDateISO8601.toUTCMinus3(value);
    const year = d.getUTCFullYear();
    const month = ToolFormattingDateISO8601.pad(d.getUTCMonth() + 1);
    const day = ToolFormattingDateISO8601.pad(d.getUTCDate());
    const hours = ToolFormattingDateISO8601.pad(d.getUTCHours());
    const minutes = ToolFormattingDateISO8601.pad(d.getUTCMinutes());
    const seconds = ToolFormattingDateISO8601.pad(d.getUTCSeconds());
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}
