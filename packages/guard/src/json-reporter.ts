import type { IRuleViolation } from "./rule";
import type { IReporter } from "./reporter";

export class JsonReporter implements IReporter {
  report(violations: IRuleViolation[], fixCount: number = 0): void {
    const errors = violations.filter((v) => v.severity === "error").length;
    const warnings = violations.filter((v) => v.severity === "warning").length;
    const files = new Set(violations.map((v) => v.filePath)).size;

    const output = {
      violations: violations.map((v) => ({
        rule: v.rule,
        message: v.message,
        filePath: v.filePath,
        line: v.line,
        severity: v.severity,
      })),
      summary: {
        errors,
        warnings,
        files,
        fixCount,
      },
    };

    console.log(JSON.stringify(output, null, 2));
  }
}
