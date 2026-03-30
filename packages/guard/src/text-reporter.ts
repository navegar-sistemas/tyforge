import type { IRuleViolation } from "./rule";
import type { IReporter } from "./reporter";

export class TextReporter implements IReporter {
  private static readonly RED = "\x1b[31m";
  private static readonly YELLOW = "\x1b[33m";
  private static readonly GRAY = "\x1b[90m";
  private static readonly GREEN = "\x1b[32m";
  private static readonly BOLD = "\x1b[1m";
  private static readonly RESET = "\x1b[0m";

  report(violations: IRuleViolation[], fixCount: number = 0): void {
    if (violations.length === 0 && fixCount === 0) {
      console.log(`${TextReporter.BOLD}tyforge-guard:${TextReporter.RESET} no violations found`);
      return;
    }

    const grouped = this.groupByFile(violations);

    for (const [filePath, fileViolations] of grouped) {
      console.log(`\n${TextReporter.BOLD}${filePath}${TextReporter.RESET}`);
      for (const v of fileViolations) {
        const color = v.severity === "error" ? TextReporter.RED : TextReporter.YELLOW;
        const icon = v.severity === "error" ? "x" : "!";
        console.log(`  ${color}${icon}${TextReporter.RESET} ${TextReporter.GRAY}line ${v.line}${TextReporter.RESET} — ${color}${v.rule}${TextReporter.RESET} — ${v.message}`);
      }
    }

    const errors = violations.filter(v => v.severity === "error").length;
    const warnings = violations.filter(v => v.severity === "warning").length;

    console.log(`\n${TextReporter.BOLD}tyforge-guard:${TextReporter.RESET} ${TextReporter.RED}${errors} error(s)${TextReporter.RESET}, ${TextReporter.YELLOW}${warnings} warning(s)${TextReporter.RESET}`);

    const byRule = this.groupByRule(violations);
    if (byRule.size > 0) {
      console.log("");
      const maxRuleLen = Math.max(...[...byRule.keys()].map(k => k.length));
      for (const [ruleName, ruleViolations] of byRule) {
        const ruleErrors = ruleViolations.filter(v => v.severity === "error").length;
        const ruleWarnings = ruleViolations.filter(v => v.severity === "warning").length;
        const padded = ruleName + ":";
        const parts: string[] = [];
        if (ruleErrors > 0) parts.push(`${TextReporter.RED}${ruleErrors} error(s)${TextReporter.RESET}`);
        if (ruleWarnings > 0) parts.push(`${TextReporter.YELLOW}${ruleWarnings} warning(s)${TextReporter.RESET}`);
        console.log(`  ${padded.padEnd(maxRuleLen + 2)} ${parts.join(", ")}`);
      }
    }

    if (fixCount > 0) {
      console.log(`\n${TextReporter.GREEN}${fixCount} fix(es) applied${TextReporter.RESET}`);
    }

    console.log("");
  }

  private groupByFile(violations: IRuleViolation[]): Map<string, IRuleViolation[]> {
    const grouped = new Map<string, IRuleViolation[]>();
    for (const v of violations) {
      const existing = grouped.get(v.filePath) ?? [];
      existing.push(v);
      grouped.set(v.filePath, existing);
    }
    return grouped;
  }

  private groupByRule(violations: IRuleViolation[]): Map<string, IRuleViolation[]> {
    const grouped = new Map<string, IRuleViolation[]>();
    for (const v of violations) {
      const existing = grouped.get(v.rule) ?? [];
      existing.push(v);
      grouped.set(v.rule, existing);
    }
    return grouped;
  }
}
