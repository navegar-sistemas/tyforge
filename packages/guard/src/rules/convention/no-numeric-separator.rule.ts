import { Rule } from "../../rule";
import type { IRuleViolation } from "../../rule";

export class NoNumericSeparatorRule extends Rule {
  private readonly pattern = /\b\d[\d_]*_[\d_]*\b/;

  constructor(severity: "error" | "warning" = "error") {
    super(
      "no-numeric-separator",
      "Numeric separators are forbidden. Use 30000 instead of 30_000",
      severity,
    );
  }

  check(
    line: string,
    lineNumber: number,
    filePath: string,
  ): IRuleViolation | null {
    const code = this.stripLiterals(line);

    const trimmed = code.trim();
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*")
    )
      return null;

    if (this.pattern.test(code)) {
      return this.violation(
        lineNumber,
        filePath,
        "Numeric separators are forbidden. Use 30000 instead of 30_000",
      );
    }

    return null;
  }
}
