import * as ts from "typescript";
import { AstRule } from "../../ast-rule";
import { AstAnalyzer } from "../../ast-analyzer";
import type { IAstRuleContext } from "../../ast-rule";
import type { IRuleViolation } from "../../rule";

export class NoInvalidFactorySignatureRule extends AstRule {
  constructor(severity: "error" | "warning" = "error") {
    super(
      "no-invalid-factory-signature",
      "TypeField and schema-compatible classes must have create/assign(data, fieldPath?) signatures",
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

      const isTypeField = AstAnalyzer.extendsFrom(
        context.checker,
        node,
        "TypeField",
      );
      if (isTypeField) {
        this.validateSchemaCompatible(node, context, violations);
        return;
      }

      // Aggregates/Entities have business create() — not schema types
      const isEntity = AstAnalyzer.extendsFrom(context.checker, node, "Entity");
      if (isEntity) return;

      // DTOs have their own create pattern
      const isDto =
        AstAnalyzer.extendsFrom(context.checker, node, "Dto") ||
        AstAnalyzer.extendsFrom(context.checker, node, "DtoReq") ||
        AstAnalyzer.extendsFrom(context.checker, node, "DtoRes");
      if (isDto) return;

      // DomainEvent/IntegrationEvent have their own patterns
      const isEvent =
        AstAnalyzer.extendsFrom(context.checker, node, "DomainEvent") ||
        AstAnalyzer.extendsFrom(context.checker, node, "IntegrationEvent");
      if (isEvent) return;

      // ValueObjects extending ClassDomainModels that have both create AND assign → schema type
      const isClassDomainModel = AstAnalyzer.extendsFrom(
        context.checker,
        node,
        "ClassDomainModels",
      );
      if (isClassDomainModel) {
        const hasCreate = AstAnalyzer.hasStaticMethod(
          context.checker,
          node,
          "create",
        );
        const hasAssign = AstAnalyzer.hasStaticMethod(
          context.checker,
          node,
          "assign",
        );
        if (hasCreate && hasAssign) {
          this.validateSchemaCompatible(node, context, violations);
        }
      }
    });

    return violations;
  }

  private validateSchemaCompatible(
    classDecl: ts.ClassDeclaration,
    context: IAstRuleContext,
    violations: IRuleViolation[],
  ): void {
    this.validateMethod(classDecl, "create", context, violations);
    this.validateMethod(classDecl, "assign", context, violations);
  }

  private validateMethod(
    classDecl: ts.ClassDeclaration,
    methodName: string,
    context: IAstRuleContext,
    violations: IRuleViolation[],
  ): void {
    const method = AstAnalyzer.hasStaticMethod(
      context.checker,
      classDecl,
      methodName,
    );
    if (!method) return;

    const line =
      context.sourceFile.getLineAndCharacterOfPosition(method.getStart()).line +
      1;
    const params = method.parameters;

    if (params.length !== 2) {
      violations.push(
        this.violation(
          line,
          context.filePath,
          `static ${methodName}() has ${params.length} parameter(s) — requires exactly 2: (raw: T/unknown, fieldPath: string)`,
        ),
      );
      return;
    }

    const first = params[0];
    const firstName = AstAnalyzer.getParamName(first);
    if (firstName !== "raw" && firstName !== "value") {
      violations.push(
        this.violation(
          line,
          context.filePath,
          `static ${methodName}() first parameter must be named "raw" or "value" — found "${firstName}"`,
        ),
      );
    }
    if (!AstAnalyzer.isParamTypeUnknownOrGeneric(first)) {
      const actualType = AstAnalyzer.getParamTypeName(first);
      violations.push(
        this.violation(
          line,
          context.filePath,
          `static ${methodName}() first parameter type must be unknown or generic T — found "${actualType}"`,
        ),
      );
    }

    const second = params[1];
    const secondName = AstAnalyzer.getParamName(second);
    if (secondName !== "fieldPath") {
      violations.push(
        this.violation(
          line,
          context.filePath,
          `static ${methodName}() second parameter must be named "fieldPath" — found "${secondName}"`,
        ),
      );
    }

    const secondType = AstAnalyzer.getParamTypeName(second);
    if (secondType !== "string" && secondType !== "") {
      violations.push(
        this.violation(
          line,
          context.filePath,
          `static ${methodName}() second parameter type must be string — found "${secondType}"`,
        ),
      );
    }
  }
}
