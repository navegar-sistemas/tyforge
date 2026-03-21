import { ExceptionDate } from "@tyforge/exceptions/date.exception";
import { Result, ok, err } from "@tyforge/result/result";

export class ToolParseDateISO8601 {
  /**
   * Checks if a Date object represents a valid date.
   * @param date The Date object to check.
   * @returns `true` if the date is valid, `false` otherwise.
   */
  static isValidDate(date: Date): boolean {
    // Check for invalid date objects (e.g., from new Date('invalid string'))
    return !isNaN(date.getTime());
  }

  /**
   * Helper to create the specific date invalid exception.
   * @returns An instance of ExceptionDate.
   */
  private static createError(): ExceptionDate {
    return ExceptionDate.invalid("data");
  }
  /**
   * Faz o parse de um datetime no formato ISO8601 com UTC obrigatório (sufixo "Z").
   * Exemplo válido: "2025-03-24T15:30:45Z"
   */
  static parseDateTimeUTC(value: unknown): Result<Date, ExceptionDate> {
    if (value instanceof Date) {
      return this.isValidDate(value) ? ok(value) : err(this.createError());
    }

    if (typeof value !== "string") {
      return err(this.createError());
    }

    // Valida se termina com 'Z' para garantir que é UTC
    if (!value.endsWith("Z")) {
      return err(this.createError());
    }

    // Regex opcional (se quiser reforçar o padrão)
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
    if (!regex.test(value)) {
      return err(this.createError());
    }

    const date = new Date(value);

    return this.isValidDate(date) ? ok(date) : err(this.createError());
  }
  /**
   * Parses a string potentially representing a full ISO 8601 DateTime (like '2025-03-24T15:30:45' or '2025-03-24T15:30:45Z').
   * Also accepts existing Date objects. Relies on the Date constructor's parsing and validates the result.
   * @param value The input value (string, Date, or other).
   * @returns Result<Date, ExceptionDate>
   */
  static parseDateTime(value: unknown): Result<Date, ExceptionDate> {
    if (value instanceof Date) {
      // If it's already a Date object, just validate it
      return this.isValidDate(value) ? ok(value) : err(this.createError());
    }

    // Expect a string for parsing
    if (typeof value !== "string") {
      return err(this.createError());
    }

    // Attempt to parse the string using the built-in Date constructor
    const date = new Date(value);

    // Check if the resulting Date object is valid (handles 'Invalid Date')
    return this.isValidDate(date) ? ok(date) : err(this.createError());
  }

  /**
   * Parses a string potentially representing an ISO 8601 Date only (like '2025-03-24').
   * Also accepts existing Date objects (normalizes time to UTC midnight).
   * @param value The input value (string, Date, or other).
   * @returns Result<Date, ExceptionDate>
   */
  static parseDate(value: unknown): Result<Date, ExceptionDate> {
    if (value instanceof Date) {
      // Normalize existing Date objects to UTC midnight for consistency
      if (!this.isValidDate(value)) return err(this.createError());
      const dateOnly = new Date(value);
      dateOnly.setUTCHours(0, 0, 0, 0); // Set time components to zero UTC
      return ok(dateOnly);
    }

    if (typeof value !== "string") {
      return err(this.createError());
    }

    // Basic format check for YYYY-MM-DD
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(value)) {
      return err(this.createError());
    }

    // Append time and 'Z' (UTC indicator) for reliable parsing to UTC midnight
    const date = new Date(`${value}T00:00:00Z`);

    return this.isValidDate(date) ? ok(date) : err(this.createError());
  }

  /**
   * Parses a compact ISO 8601 Date string (like '20250324').
   * Also accepts existing Date objects (normalizes time to UTC midnight).
   * @param value The input value (string, Date, or other).
   * @returns Result<Date, ExceptionDate>
   */
  static parseDateCompact(value: unknown): Result<Date, ExceptionDate> {
    try {
      if (value instanceof Date) {
        // Normalize existing Date objects to UTC midnight
        if (!this.isValidDate(value)) return err(this.createError());
        const dateOnly = new Date(value);
        dateOnly.setUTCHours(0, 0, 0, 0);
        return ok(dateOnly);
      }

      if (typeof value !== "string") {
        return err(this.createError());
      }

      // Check for exactly 8 digits
      const regex = /^\d{8}$/;
      if (!regex.test(value)) {
        return err(this.createError());
      }

      // Extract parts and reconstruct standard ISO string with UTC time
      const year = value.substring(0, 4);
      const month = value.substring(4, 6);
      const day = value.substring(6, 8);
      const isoString = `${year}-${month}-${day}T00:00:00Z`; // Use Z for UTC

      const date = new Date(isoString);
      return this.isValidDate(date) ? ok(date) : err(this.createError());
    } catch {
      return err(this.createError());
    }
  }

  /**
   * Parses a compact ISO 8601 DateTime string where date is compact but time has separators (like '20250324T15:30:45').
   * Also accepts existing Date objects.
   * @param value The input value (string, Date, or other).
   * @returns Result<Date, ExceptionDate>
   */
  static parseDateTimeCompactWithT(
    value: unknown,
  ): Result<Date, ExceptionDate> {
    if (value instanceof Date) {
      return this.isValidDate(value) ? ok(value) : err(this.createError());
    }

    if (typeof value !== "string") {
      return err(this.createError());
    }

    // Check for format YYYYMMDDTHH:MM:SS
    const regex = /^\d{8}T\d{2}:\d{2}:\d{2}$/;
    if (!regex.test(value)) {
      return err(this.createError());
    }

    // Extract parts and reconstruct standard ISO string for reliable parsing
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    const time = value.substring(9); // e.g., 15:30:45
    // NOTE: Creates date in local timezone unless input implies otherwise (e.g., if T time was Z or offset)
    const isoString = `${year}-${month}-${day}T${time}`;

    const date = new Date(isoString);
    return this.isValidDate(date) ? ok(date) : err(this.createError());
  }

  /**
   * Parses a fully compact ISO 8601 DateTime string (like '20250324153045').
   * Also accepts existing Date objects.
   * @param value The input value (string, Date, or other).
   * @returns Result<Date, ExceptionDate>
   */
  static parseDateTimeFullCompact(value: unknown): Result<Date, ExceptionDate> {
    if (value instanceof Date) {
      return this.isValidDate(value) ? ok(value) : err(this.createError());
    }

    if (typeof value !== "string") {
      return err(this.createError());
    }

    // Check for exactly 14 digits
    const regex = /^\d{14}$/;
    if (!regex.test(value)) {
      return err(this.createError());
    }

    // Extract parts and reconstruct standard ISO string
    const year = value.substring(0, 4);
    const month = value.substring(4, 6);
    const day = value.substring(6, 8);
    const hours = value.substring(8, 10);
    const minutes = value.substring(10, 12);
    const seconds = value.substring(12, 14);
    // NOTE: Creates date in local timezone. Append 'Z' if input implies UTC.
    const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

    const date = new Date(isoString);
    return this.isValidDate(date) ? ok(date) : err(this.createError());
  }
  /**
   * Faz o parse de um datetime ISO8601 com milissegundos e UTC (sufixo 'Z').
   * Exemplo válido: "2025-03-24T15:30:45.123Z"
   */
  static parseDateTimeZuluWithMillis(
    value: unknown,
  ): Result<Date, ExceptionDate> {
    if (value instanceof Date) {
      return this.isValidDate(value) ? ok(value) : err(this.createError());
    }

    if (typeof value !== "string") {
      return err(this.createError());
    }

    // Regex para validar formato: YYYY-MM-DDTHH:mm:ss.sssZ
    const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (!regex.test(value)) {
      return err(this.createError());
    }

    const date = new Date(value);
    return this.isValidDate(date) ? ok(date) : err(this.createError());
  }
}
