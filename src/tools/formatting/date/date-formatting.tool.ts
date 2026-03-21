export class ToolFormattingDateISO8601 {
  private static pad(num: number): string {
    return num.toString().padStart(2, "0");
  }

  /**
   * Converte uma data para UTC-3 (Brasília).
   * Para datas que já estão em UTC (como as vindas de parseDateCompact),
   * apenas subtrai 3 horas para converter para UTC-3.
   */
  private static toUTCMinus3(date: Date): Date {
    // Para datas que vêm de parseDateCompact (que já estão em UTC),
    // apenas subtraímos 3 horas para converter para UTC-3
    return new Date(date.getTime() - 3 * 60 * 60 * 1000);
  }

  /**
   * ISO 8601 com milissegundos e sufixo Z (UTC real).
   * Exemplo: "2024-04-09T18:00:00.123Z"
   */
  static formatDateTimeUTC(value: Date): string {
    return value.toISOString();
  }

  /**
   * Data e hora no formato ISO 8601 em UTC-3.
   * Exemplo: "2024-04-09T15:00:00"
   */
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

  /**
   * Apenas data (YYYY-MM-DD) em UTC-3.
   * Exemplo: "2024-04-09"
   */
  static formatDate(value: Date): string {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      throw new Error("Invalid Date input");
    }

    // Adjust to UTC-3 by subtracting 3 hours (3 * 60 * 60 * 1000 milliseconds)
    const utcMinus3 = new Date(value.getTime() - 3 * 60 * 60 * 1000);

    // Extract year, month, day in UTC
    const year = utcMinus3.getUTCFullYear();
    const month = String(utcMinus3.getUTCMonth() + 1).padStart(2, "0");
    const day = String(utcMinus3.getUTCDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /**
   * Data compacta (YYYYMMDD) em UTC.
   * Exemplo: "20240409"
   */
  static formatDateCompact(value: Date): string {
    const year = value.getUTCFullYear();
    const month = ToolFormattingDateISO8601.pad(value.getUTCMonth() + 1);
    const day = ToolFormattingDateISO8601.pad(value.getUTCDate());

    return `${year}${month}${day}`;
  }

  /**
   * Data e hora compacta com separador T em UTC-3.
   * Exemplo: "20240409T153000"
   */
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

  /**
   * Data e hora compacta sem separadores em UTC-3.
   * Exemplo: "20240409153000"
   */
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
  /**
   * Data e hora com milissegundos (ISO8601 Zulu com .sssZ).
   * Exemplo: "2024-04-09T18:00:00.123Z"
   */
  static formatDateTimeZuluWithMillis(value: Date): string {
    return value.toISOString(); // já inclui milissegundos e sufixo Z
  }
}
