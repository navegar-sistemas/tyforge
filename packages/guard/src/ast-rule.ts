import type { IRuleViolation } from "./rule";
import type * as ts from "typescript";

export interface IAstRuleContext {
  sourceFile: ts.SourceFile;
  checker: ts.TypeChecker;
  filePath: string;
}

export abstract class AstRule {
  constructor(
    readonly name: string,
    readonly description: string,
    readonly severity: "error" | "warning" = "error",
  ) {}

  abstract check(context: IAstRuleContext): IRuleViolation[];

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
