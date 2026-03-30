import { Rule } from "../../rule";
import type { IRuleViolation } from "../../rule";

export class NoMagicHttpStatusRule extends Rule {
  private readonly statusCodes = /\b(200|201|204|301|302|400|401|403|404|409|422|429|500|502|503)\b/;

  constructor(severity: "error" | "warning" = "warning") {
    super("no-magic-http-status", "Forbids magic HTTP numbers — use OHttpStatus", severity);
  }

  check(line: string, lineNumber: number, filePath: string): IRuleViolation | null {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*")) return null;

    if (this.isTestFile(filePath)) return null;
    if (filePath.includes("http-status")) return null;

    const code = this.stripLiterals(line);

    if (this.statusCodes.test(code) && /status|response|reply|res\./i.test(code)) {
      return this.violation(lineNumber, filePath, "Use OHttpStatus instead of magic HTTP number");
    }

    return null;
  }
}
