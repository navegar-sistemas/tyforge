import { Rule } from "../rule";
import type { IRuleViolation } from "../rule";

export class NoToJsonLowercaseRule extends Rule {
  constructor(severity: "error" | "warning" = "error") {
    super("no-to-json-lowercase", "Forbids toJson() — use toJSON() (capital JSON)", severity, true);
  }

  check(line: string, lineNumber: number, filePath: string): IRuleViolation | null {
    const code = this.stripLiterals(line);

    if (/\.toJson\b/.test(code)) {
      return this.violation(lineNumber, filePath, "Use toJSON() (capital JSON), not toJson()");
    }
    return null;
  }

  override fix(line: string): string {
    if (/\.toJson\b/.test(line)) {
      return line.replace(/\.toJson\b/g, ".toJSON");
    }
    return line;
  }
}
