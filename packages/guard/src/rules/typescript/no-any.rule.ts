import { Rule } from "../../rule";
import type { IRuleViolation } from "../../rule";

export class NoAnyRule extends Rule {
  private readonly pattern = /\bany\b/;

  private readonly falsePositives = [
    /^\s*\/\//,
    /^\s*\*/,
    /^\s*\/\*/,
    /\.any\(/,
  ];

  private readonly typePositions = [
    /:\s*any\b/,
    /<any>/,
    /<.*\bany\b.*>/,
    /any\[\]/,
    /any\s*[;,)>|&]/,
    /\bany\s*=>/,
    /satisfies\s+any\b/,
  ];

  constructor(severity: "error" | "warning" = "error") {
    super("no-any", "Forbids 'any' usage in production code", severity);
  }

  check(line: string, lineNumber: number, filePath: string): IRuleViolation | null {
    if (this.isTestFile(filePath)) return null;

    const code = this.stripLiterals(line);

    if (!this.pattern.test(code)) return null;

    for (const fp of this.falsePositives) {
      if (fp.test(line)) return null;
    }

    for (const tp of this.typePositions) {
      if (tp.test(code)) {
        return this.violation(lineNumber, filePath, "'any' usage is forbidden in production code");
      }
    }

    return null;
  }
}
