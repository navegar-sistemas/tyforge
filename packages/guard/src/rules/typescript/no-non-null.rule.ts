import { Rule } from "../../rule";
import type { IRuleViolation } from "../../rule";

export class NoNonNullRule extends Rule {
  private readonly patterns = [/\w!\.\w/, /\w!\[/, /\w!\s*[;,)\]>}]/];

  private readonly falsePositives = /!==|!=/;

  constructor(severity: "error" | "warning" = "error") {
    super("no-non-null", "Forbids '!' non-null assertion", severity);
  }

  check(
    line: string,
    lineNumber: number,
    _filePath: string,
  ): IRuleViolation | null {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return null;

    const code = this.stripLiterals(line);
    const cleaned = code.replace(this.falsePositives, "");

    for (const pattern of this.patterns) {
      if (pattern.test(cleaned)) {
        return this.violation(
          lineNumber,
          _filePath,
          "Non-null assertion '!' is forbidden — use guard or explicit check",
        );
      }
    }

    return null;
  }
}
