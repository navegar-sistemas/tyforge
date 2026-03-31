import { Rule } from "../../rule";
import type { IRuleViolation } from "../../rule";

export class NoNewTypeFieldRule extends Rule {
  private readonly pattern = /new\s+F[A-Z]\w+\s*\(/;

  constructor(severity: "error" | "warning" = "error") {
    super(
      "no-new-type-field",
      "Forbids instantiating TypeFields with new — use create() or createOrThrow()",
      severity,
    );
  }

  check(
    line: string,
    lineNumber: number,
    filePath: string,
  ): IRuleViolation | null {
    const code = this.stripLiterals(line);

    if (!this.pattern.test(code)) return null;
    if (filePath.includes("format_vo.ts") || filePath.includes("type-field"))
      return null;

    return this.violation(
      lineNumber,
      filePath,
      "Don't use 'new' for TypeFields — use create() or createOrThrow()",
    );
  }
}
