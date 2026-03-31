import { Rule } from "../../rule";
import type { IRuleViolation } from "../../rule";

export class NoThrowInDomainRule extends Rule {
  private readonly pattern = /\bthrow\s+/;

  private readonly domainPaths = ["domain-models/", "domain/", "type-fields/"];

  // Files where throw is acceptable (framework internals)
  private readonly allowedFiles = [".typefield.ts", ".base.ts"];

  private readonly allowedContexts = [
    /\bcreateOrThrow\b/,
    /\bassertNever\b/,
    /\bassertNeverLocale\b/,
    /\bassertQueueName\b/,
    /\bgetClassInfo\b/,
  ];

  constructor(severity: "error" | "warning" = "error") {
    super(
      "no-throw-in-domain",
      "Domain layer must return Result<T, Exceptions> instead of throwing",
      severity,
    );
  }

  check(
    line: string,
    lineNumber: number,
    filePath: string,
  ): IRuleViolation | null {
    if (this.isTestFile(filePath)) return null;

    const inDomain = this.domainPaths.some((p) => filePath.includes(p));
    if (!inDomain) return null;

    if (this.allowedFiles.some((f) => filePath.endsWith(f))) return null;

    const code = this.stripLiterals(line);

    const trimmed = code.trim();
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*")
    )
      return null;

    if (!this.pattern.test(code)) return null;

    for (const ctx of this.allowedContexts) {
      if (ctx.test(code)) return null;
    }

    return this.violation(
      lineNumber,
      filePath,
      "Domain layer must return Result<T, Exceptions> instead of throwing. Use err(ExceptionBusiness.xxx())",
    );
  }
}
