import type { IRuleViolation } from "./rule";
import type { DisableCommentParser } from "./disable-comment-parser";
import type { RuleRegistry } from "./rule-registry";
import * as fs from "node:fs";
import * as path from "node:path";

export class Linter {
  constructor(
    private readonly registry: RuleRegistry,
    private readonly disableParser: DisableCommentParser,
  ) {}

  checkFile(filePath: string, fixMode = false): IRuleViolation[] {
    const absolutePath = path.resolve(filePath);
    const content = fs.readFileSync(absolutePath, "utf-8");
    const endsWithNewline = content.endsWith("\n");
    const allLines = content.split("\n");
    // Remove trailing empty element produced by split so rules do not act on it
    const lines = endsWithNewline && allLines[allLines.length - 1] === ""
      ? allLines.slice(0, -1)
      : allLines;
    const disableState = this.disableParser.parse(lines);
    const rules = this.registry.getActive();
    const violations: IRuleViolation[] = [];
    const fixedLines: string[] = [];
    let hasFixes = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      for (const rule of rules) {
        if (disableState.isDisabled(i, rule.name)) continue;
        const violation = rule.check(line, i + 1, absolutePath);
        if (!violation) continue;
        violation.severity = this.registry.getSeverity(rule.name, violation.severity);
        if (fixMode && rule.fix) {
          const fixed = rule.fix(line);
          if (fixed !== line) {
            line = fixed;
            hasFixes = true;
            continue;
          }
        }
        violations.push(violation);
      }
      fixedLines.push(line);
    }

    if (fixMode && hasFixes) {
      fs.writeFileSync(absolutePath, fixedLines.join("\n") + (endsWithNewline ? "\n" : ""), "utf-8");
    }

    return violations;
  }

  checkFiles(filePaths: string[], fixMode = false): IRuleViolation[] {
    const violations: IRuleViolation[] = [];
    for (const filePath of filePaths) {
      if (!filePath.endsWith(".ts")) continue;
      violations.push(...this.checkFile(filePath, fixMode));
    }
    return violations;
  }
}
