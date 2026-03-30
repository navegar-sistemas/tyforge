import * as ts from "typescript";
import * as nodePath from "node:path";
import type { AstRule, IAstRuleContext } from "./ast-rule";
import type { IRuleViolation } from "./rule";

export class AstAnalyzer {
  private program: ts.Program | null = null;

  createProgram(filePaths: string[], tsconfigPath?: string): void {
    if (tsconfigPath) {
      const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
      const configDir = nodePath.dirname(tsconfigPath);
      const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, configDir);
      // Use all files from tsconfig for full type resolution, lint only targets
      this.program = ts.createProgram(parsed.fileNames, parsed.options);
    } else {
      this.program = ts.createProgram(filePaths, {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ES2022,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        strict: true,
        skipLibCheck: true,
      });
    }
  }

  check(filePaths: string[], rules: AstRule[]): IRuleViolation[] {
    if (!this.program || rules.length === 0) return [];
    const checker = this.program.getTypeChecker();
    const violations: IRuleViolation[] = [];
    const targetSet = new Set(filePaths.map((f) => nodePath.resolve(f)));

    for (const sourceFile of this.program.getSourceFiles()) {
      if (sourceFile.isDeclarationFile) continue;
      const resolved = nodePath.resolve(sourceFile.fileName);
      if (!targetSet.has(resolved)) continue;

      const context: IAstRuleContext = { sourceFile, checker, filePath: resolved };
      for (const rule of rules) {
        violations.push(...rule.check(context));
      }
    }

    return violations;
  }

  static extendsFrom(checker: ts.TypeChecker, classDecl: ts.ClassDeclaration, ancestorName: string): boolean {
    const type = checker.getTypeAtLocation(classDecl);
    return AstAnalyzer.typeExtendsFrom(checker, type, ancestorName, new Set());
  }

  private static typeExtendsFrom(checker: ts.TypeChecker, type: ts.Type, ancestorName: string, visited: Set<string>): boolean {
    const symbol = type.getSymbol();
    const typeName = symbol?.getName() ?? "";
    if (visited.has(typeName)) return false;
    visited.add(typeName);

    const baseTypes = type.getBaseTypes?.();
    if (!baseTypes) return false;

    for (const base of baseTypes) {
      const baseSymbol = base.getSymbol();
      if (baseSymbol && baseSymbol.getName() === ancestorName) return true;

      // Resolve through declarations to follow the full chain across modules
      if (baseSymbol) {
        const declarations = baseSymbol.getDeclarations();
        if (declarations) {
          for (const decl of declarations) {
            if (ts.isClassDeclaration(decl)) {
              const declType = checker.getTypeAtLocation(decl);
              if (AstAnalyzer.typeExtendsFrom(checker, declType, ancestorName, visited)) return true;
            }
          }
        }
      }
    }

    return false;
  }

  static hasStaticMethod(_checker: ts.TypeChecker, classDecl: ts.ClassDeclaration, methodName: string): ts.MethodDeclaration | undefined {
    for (const member of classDecl.members) {
      if (!ts.isMethodDeclaration(member)) continue;
      if (!member.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword)) continue;
      if (member.name && ts.isIdentifier(member.name) && member.name.text === methodName) {
        return member;
      }
    }
    return undefined;
  }

  static getMethodParamCount(method: ts.MethodDeclaration): number {
    return method.parameters.length;
  }

  static getParamName(param: ts.ParameterDeclaration): string {
    return ts.isIdentifier(param.name) ? param.name.text : "";
  }

  static getParamTypeName(param: ts.ParameterDeclaration): string {
    if (!param.type) return "";
    if (param.type.kind === ts.SyntaxKind.UnknownKeyword) return "unknown";
    if (param.type.kind === ts.SyntaxKind.StringKeyword) return "string";
    if (param.type.kind === ts.SyntaxKind.NumberKeyword) return "number";
    if (param.type.kind === ts.SyntaxKind.BooleanKeyword) return "boolean";
    if (ts.isTypeReferenceNode(param.type) && ts.isIdentifier(param.type.typeName)) {
      return param.type.typeName.text;
    }
    return "";
  }

  static isParamTypeUnknownOrGeneric(param: ts.ParameterDeclaration): boolean {
    const typeName = AstAnalyzer.getParamTypeName(param);
    return typeName === "unknown" || typeName === "T";
  }

  static isParamOptionalOrDefaulted(param: ts.ParameterDeclaration): boolean {
    return param.questionToken !== undefined || param.initializer !== undefined;
  }
}
