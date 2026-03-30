import { Rule } from "../../rule";
import type { IRuleViolation } from "../../rule";

export class NoSatisfiesWithoutPrefixRule extends Rule {
  private readonly pattern = /satisfies\s+([A-Z]\w+)/;

  constructor(severity: "error" | "warning" = "error") {
    super("no-satisfies-without-prefix", "Forbids satisfies without I prefix — use satisfies ISchema, not satisfies Schema", severity);
  }

  check(line: string, lineNumber: number, filePath: string): IRuleViolation | null {
    const code = this.stripLiterals(line);
    const match = this.pattern.exec(code);
    if (!match) return null;

    const typeName = match[1];
    if (typeName.length > 1 && typeName.startsWith("I") && typeName[1] >= "A" && typeName[1] <= "Z") return null;

    return this.violation(lineNumber, filePath, `satisfies ${typeName} — use I prefix: satisfies I${typeName}`);
  }
}
