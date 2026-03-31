import { Rule } from "../../rule";
import type { IRuleViolation } from "../../rule";

export class NoConsoleRule extends Rule {
  private readonly pattern = /\bconsole\.(log|warn|error|debug|info)\s*\(/;

  private readonly ignoredPaths = [
    "guard/",
    "pre-commit/",
    "reporters/",
  ];

  constructor(severity: "error" | "warning" = "error") {
    super("no-console", "Use Result<T, E> or ILogger instead of console methods in production code", severity);
  }

  check(line: string, lineNumber: number, filePath: string): IRuleViolation | null {
    if (this.isTestFile(filePath)) return null;
    if (filePath.includes("examples/")) return null;

    for (const ignored of this.ignoredPaths) {
      if (filePath.includes(ignored)) return null;
    }

    const code = this.stripLiterals(line);

    const trimmed = code.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return null;

    if (this.pattern.test(code)) {
      return this.violation(lineNumber, filePath, "Use Result<T, E> or ILogger instead of console methods in production code");
    }

    return null;
  }
}
