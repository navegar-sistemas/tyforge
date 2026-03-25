import { Rule } from "../rule";
import type { IRuleViolation } from "../rule";

export class NoCastRule extends Rule {
  private readonly asPattern = / as /;
  private readonly allowedAs = / as const\b| as uuidv| as assert/;
  private readonly importAlias = /import\s.*\bas\b/;
  private readonly angleBracket = /=\s*<[A-Z]\w+>/;

  constructor(severity: "error" | "warning" = "error") {
    super("no-cast", "Forbids 'as' type cast and angle bracket assertion", severity);
  }

  check(line: string, lineNumber: number, filePath: string): IRuleViolation | null {
    if (this.isTestFile(filePath)) return null;

    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) return null;

    const code = this.stripLiterals(line);

    if (this.angleBracket.test(code)) {
      return this.violation(lineNumber, filePath, "Angle bracket assertion '<Type>' is forbidden — use type guard");
    }

    if (!this.asPattern.test(code)) return null;
    if (this.allowedAs.test(code)) return null;
    if (this.importAlias.test(code)) return null;
    if (code.includes("[K in keyof")) return null;

    if (/export\s*\{.*\bas\b/.test(code)) return null;

    return this.violation(lineNumber, filePath, "'as' cast is forbidden — use type guard or assertType");
  }
}
