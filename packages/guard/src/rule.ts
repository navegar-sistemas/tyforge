export interface IRuleViolation {
  rule: string;
  severity: "error" | "warning";
  message: string;
  filePath: string;
  line: number;
}

export abstract class Rule {
  constructor(
    readonly name: string,
    readonly description: string,
    readonly severity: "error" | "warning" = "error",
    readonly fixable: boolean = false,
  ) {}

  abstract check(
    line: string,
    lineNumber: number,
    filePath: string,
  ): IRuleViolation | null;

  fix?(line: string): string;

  protected isTestFile(filePath: string): boolean {
    return (
      filePath.includes("__tests__") ||
      filePath.endsWith(".test.ts") ||
      filePath.endsWith(".spec.ts")
    );
  }

  protected stripLiterals(line: string): string {
    return line
      .replace(/`[^`]*`/g, '""')
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .replace(/'(?:[^'\\]|\\.)*'/g, '""')
      .replace(/\/(?:[^/\\]|\\.)+\/[gimsuy]*/g, '""');
  }

  protected violation(
    line: number,
    filePath: string,
    message?: string,
  ): IRuleViolation {
    return {
      rule: this.name,
      severity: this.severity,
      message: message ?? this.description,
      filePath,
      line,
    };
  }
}
