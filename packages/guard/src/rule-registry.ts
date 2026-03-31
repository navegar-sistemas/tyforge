import type { Rule } from "./rule";
import { NoAnyRule } from "./rules/typescript/no-any.rule";
import { NoCastRule } from "./rules/typescript/no-cast.rule";
import { NoNonNullRule } from "./rules/typescript/no-non-null.rule";
import { NoTsIgnoreRule } from "./rules/typescript/no-ts-ignore.rule";
import { NoExportDefaultRule } from "./rules/typescript/no-export-default.rule";
import { NoToJsonLowercaseRule } from "./rules/convention/no-to-json-lowercase.rule";
import { NoNewTypeFieldRule } from "./rules/convention/no-new-type-field.rule";
import { NoMagicHttpStatusRule } from "./rules/convention/no-magic-http-status.rule";
import { NoDeclareRule } from "./rules/convention/no-declare.rule";
import { NoSatisfiesWithoutPrefixRule } from "./rules/convention/no-satisfies-without-prefix.rule";
import { NoConsoleRule } from "./rules/convention/no-console.rule";
import { NoNumericSeparatorRule } from "./rules/convention/no-numeric-separator.rule";
import { NoPrettierIgnoreRule } from "./rules/convention/no-prettier-ignore.rule";
import { MaxLineLengthRule } from "./rules/convention/max-line-length.rule";
import { NoThrowInDomainRule } from "./rules/architecture/no-throw-in-domain.rule";
import { NoDirectDomainInstantiationRule } from "./rules/architecture/no-direct-domain-instantiation.rule";

export class RuleRegistry {
  static createDefault(): Rule[] {
    return [
      new NoAnyRule(),
      new NoCastRule(),
      new NoNonNullRule(),
      new NoTsIgnoreRule(),
      new NoExportDefaultRule(),
      new NoToJsonLowercaseRule(),
      new NoNewTypeFieldRule(),
      new NoMagicHttpStatusRule("warning"),
      new NoDeclareRule(),
      new NoSatisfiesWithoutPrefixRule(),
      new NoConsoleRule(),
      new NoThrowInDomainRule(),
      new NoDirectDomainInstantiationRule(),
      new NoNumericSeparatorRule(),
      new NoPrettierIgnoreRule(),
      new MaxLineLengthRule(),
    ];
  }

  static getDefaultRuleNames(): string[] {
    return RuleRegistry.createDefault().map((r) => r.name);
  }

  static getDefaultRuleCount(): number {
    return RuleRegistry.createDefault().length;
  }

  private readonly rules: Rule[] = [];
  private readonly severityOverrides = new Map<
    string,
    "error" | "warning" | "off"
  >();

  register(rule: Rule): void {
    this.rules.push(rule);
  }

  registerAll(rules: Rule[]): void {
    this.rules.push(...rules);
  }

  applyConfig(rulesConfig: Record<string, "error" | "warning" | "off">): void {
    for (const [name, severity] of Object.entries(rulesConfig)) {
      this.severityOverrides.set(name, severity);
    }
  }

  getActive(): Rule[] {
    return this.rules.filter((rule) => {
      const override = this.severityOverrides.get(rule.name);
      return override !== "off";
    });
  }

  getSeverity(
    ruleName: string,
    defaultSeverity: "error" | "warning",
  ): "error" | "warning" {
    const override = this.severityOverrides.get(ruleName);
    if (override === "error" || override === "warning") return override;
    return defaultSeverity;
  }
}
