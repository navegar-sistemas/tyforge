import { Rule } from "../../rule";
import type { IRuleViolation } from "../../rule";

export class NoPrettierIgnoreRule extends Rule {
  private readonly pattern = /prettier-ignore|eslint-disable/;

  constructor(severity: "error" | "warning" = "error") {
    super("no-prettier-ignore", "Suppressing formatter/linter rules is forbidden. Fix the underlying code instead", severity);
  }

  check(line: string, lineNumber: number, filePath: string): IRuleViolation | null {
    const code = this.stripLiterals(line);

    if (this.pattern.test(code)) {
      return this.violation(
        lineNumber,
        filePath,
        "Suppressing formatter/linter rules is forbidden. Fix the underlying code instead",
      );
    }

    return null;
  }
}
