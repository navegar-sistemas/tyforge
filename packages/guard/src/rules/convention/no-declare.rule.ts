import { Rule } from "../../rule";
import type { IRuleViolation } from "../../rule";

export class NoDeclareRule extends Rule {
  private readonly allowed = /declare\s+(module|global|namespace)\b/;

  constructor(severity: "error" | "warning" = "error") {
    super(
      "no-declare",
      "Forbids 'declare' in classes — use readonly + constructor",
      severity,
    );
  }

  check(
    line: string,
    lineNumber: number,
    filePath: string,
  ): IRuleViolation | null {
    if (filePath.endsWith(".d.ts")) return null;

    const code = this.stripLiterals(line);

    if (!/^\s+declare\s+\w/.test(code)) return null;
    if (this.allowed.test(code)) return null;

    return this.violation(
      lineNumber,
      filePath,
      "Don't use 'declare' in classes — use readonly + constructor",
    );
  }
}
