import * as ts from "typescript";
import { AstRule } from "../../ast-rule";
import { AstAnalyzer } from "../../ast-analyzer";
import type { IAstRuleContext } from "../../ast-rule";
import type { IRuleViolation } from "../../rule";

const ALLOWED_FACTORY_METHODS = new Set(["create", "assign"]);

export class NoPublicConstructorDomainRule extends AstRule {
  constructor(severity: "error" | "warning" = "error") {
    super(
      "no-public-constructor-domain",
      "Domain model classes must have private constructor and instantiate only inside create/assign",
      severity,
    );
  }

  check(context: IAstRuleContext): IRuleViolation[] {
    const violations: IRuleViolation[] = [];

    ts.forEachChild(context.sourceFile, (node) => {
      if (!ts.isClassDeclaration(node)) return;
      if (!node.name) return;

      const isAbstract = node.modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.AbstractKeyword,
      );
      if (isAbstract) return;

      const isDomainModel =
        AstAnalyzer.extendsFrom(context.checker, node, "ClassDomainModels") ||
        AstAnalyzer.extendsFrom(context.checker, node, "TypeField");
      if (!isDomainModel) return;

      this.validateConstructorVisibility(node, context, violations);
      this.validateNewExpressionLocations(node, context, violations);
    });

    return violations;
  }

  private validateConstructorVisibility(
    classDecl: ts.ClassDeclaration,
    context: IAstRuleContext,
    violations: IRuleViolation[],
  ): void {
    for (const member of classDecl.members) {
      if (!ts.isConstructorDeclaration(member)) continue;

      const isPrivateOrProtected = member.modifiers?.some(
        (m) =>
          m.kind === ts.SyntaxKind.PrivateKeyword ||
          m.kind === ts.SyntaxKind.ProtectedKeyword,
      );

      if (!isPrivateOrProtected) {
        const line =
          context.sourceFile.getLineAndCharacterOfPosition(member.getStart())
            .line + 1;
        violations.push(
          this.violation(
            line,
            context.filePath,
            `Constructor must be private — use static create/assign factory methods`,
          ),
        );
      }
      return;
    }
  }

  private validateNewExpressionLocations(
    classDecl: ts.ClassDeclaration,
    context: IAstRuleContext,
    violations: IRuleViolation[],
  ): void {
    const className = classDecl.name?.text;
    if (!className) return;

    for (const member of classDecl.members) {
      if (!ts.isMethodDeclaration(member)) continue;

      const methodName =
        member.name && ts.isIdentifier(member.name) ? member.name.text : "";
      if (ALLOWED_FACTORY_METHODS.has(methodName)) continue;

      this.walkForNewExpression(
        member,
        className,
        methodName,
        context,
        violations,
      );
    }
  }

  private walkForNewExpression(
    node: ts.Node,
    className: string,
    methodName: string,
    context: IAstRuleContext,
    violations: IRuleViolation[],
  ): void {
    ts.forEachChild(node, (child) => {
      if (
        ts.isNewExpression(child) &&
        ts.isIdentifier(child.expression) &&
        child.expression.text === className
      ) {
        const line =
          context.sourceFile.getLineAndCharacterOfPosition(child.getStart())
            .line + 1;
        violations.push(
          this.violation(
            line,
            context.filePath,
            `"new ${className}" only allowed inside static factory methods — found in instance method "${methodName}"`,
          ),
        );
      }
      this.walkForNewExpression(
        child,
        className,
        methodName,
        context,
        violations,
      );
    });
  }
}
