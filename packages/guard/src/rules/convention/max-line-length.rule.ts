import { Rule } from "../../rule";
import type { IRuleViolation } from "../../rule";

export class MaxLineLengthRule extends Rule {
  private readonly maxLength: number;

  constructor(maxLength = 80, severity: "error" | "warning" = "warning") {
    super("max-line-length", `Line exceeds ${maxLength} characters`, severity);
    this.maxLength = maxLength;
  }

  check(
    line: string,
    lineNumber: number,
    filePath: string,
  ): IRuleViolation | null {
    if (line.length <= this.maxLength) return null;

    const trimmed = line.trim();

    // Skip import/export lines (Prettier handles these)
    if (
      trimmed.startsWith("import ") ||
      trimmed.startsWith("export {") ||
      trimmed.startsWith("export type {") ||
      trimmed.startsWith("export * from")
    ) {
      return null;
    }

    // Skip comments that contain URLs
    if (
      (trimmed.startsWith("//") || trimmed.startsWith("*")) &&
      /https?:\/\/\S+/.test(trimmed)
    ) {
      return null;
    }

    // Skip lines that are only a string literal
    if (/^\s*["'`].*["'`][,;]?\s*$/.test(line)) return null;

    // Skip regex literals
    if (/^\s*\/.*\/[gimsuy]*[,;]?\s*$/.test(line)) return null;

    return this.violation(
      lineNumber,
      filePath,
      `Line has ${line.length} characters (max ${this.maxLength})`,
    );
  }
}
