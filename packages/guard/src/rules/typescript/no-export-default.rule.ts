import { Rule } from "../../rule";
import type { IRuleViolation } from "../../rule";

export class NoExportDefaultRule extends Rule {
  private readonly patterns = [/^\s*export\s+default\b/, /\bas\s+default\b/];

  constructor(severity: "error" | "warning" = "error") {
    super(
      "no-export-default",
      "Forbids export default — use named exports",
      severity,
      true,
    );
  }

  check(
    line: string,
    lineNumber: number,
    filePath: string,
  ): IRuleViolation | null {
    const code = this.stripLiterals(line);

    for (const pattern of this.patterns) {
      if (pattern.test(code)) {
        return this.violation(
          lineNumber,
          filePath,
          "Export default is forbidden — use named export",
        );
      }
    }
    return null;
  }

  override fix(line: string): string {
    if (/^\s*export\s+default\s+class\s/.test(line)) {
      return line.replace(/export\s+default\s+class\s/, "export class ");
    }
    if (/^\s*export\s+default\s+function\s/.test(line)) {
      return line.replace(/export\s+default\s+function\s/, "export function ");
    }
    if (/^\s*export\s+default\s+const\s/.test(line)) {
      return line.replace(/export\s+default\s+const\s/, "export const ");
    }
    return line;
  }
}
