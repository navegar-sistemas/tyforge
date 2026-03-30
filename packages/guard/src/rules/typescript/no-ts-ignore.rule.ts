import { Rule } from "../../rule";
import type { IRuleViolation } from "../../rule";

export class NoTsIgnoreRule extends Rule {
  private readonly pattern = /@ts-ignore|@ts-expect-error/;

  constructor(severity: "error" | "warning" = "error") {
    super("no-ts-ignore", "Forbids @ts-ignore and @ts-expect-error usage", severity);
  }

  check(line: string, lineNumber: number, filePath: string): IRuleViolation | null {
    const code = this.stripLiterals(line);

    if (this.pattern.test(code)) {
      return this.violation(lineNumber, filePath, "@ts-ignore/@ts-expect-error usage is forbidden");
    }
    return null;
  }
}
