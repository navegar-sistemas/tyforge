import { Rule } from "../rule";
import type { IRuleViolation } from "../rule";

export class NoDirectDomainInstantiationRule extends Rule {
  private readonly pattern = /\bnew\s+(Entity|Aggregate|ValueObject|DomainEvent)\s*\(/;

  constructor(severity: "error" | "warning" = "error") {
    super(
      "no-direct-domain-instantiation",
      "Use static factory method .create() instead of direct domain model instantiation",
      severity,
    );
  }

  check(line: string, lineNumber: number, filePath: string): IRuleViolation | null {
    if (this.isTestFile(filePath)) return null;
    if (filePath.includes("domain-models/")) return null;

    const code = this.stripLiterals(line);

    const trimmed = code.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return null;

    if (this.pattern.test(code)) {
      return this.violation(
        lineNumber,
        filePath,
        "Use static factory method .create() instead of direct domain model instantiation",
      );
    }

    return null;
  }
}
