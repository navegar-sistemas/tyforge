import type { Rule } from "./rule";
import { NoAnyRule } from "./rules/no-any.rule";
import { NoCastRule } from "./rules/no-cast.rule";
import { NoNonNullRule } from "./rules/no-non-null.rule";
import { NoTsIgnoreRule } from "./rules/no-ts-ignore.rule";
import { NoExportDefaultRule } from "./rules/no-export-default.rule";
import { NoToJsonLowercaseRule } from "./rules/no-to-json-lowercase.rule";
import { NoNewTypeFieldRule } from "./rules/no-new-type-field.rule";
import { NoMagicHttpStatusRule } from "./rules/no-magic-http-status.rule";
import { NoDeclareRule } from "./rules/no-declare.rule";
import { NoSatisfiesWithoutPrefixRule } from "./rules/no-satisfies-without-prefix.rule";
import { NoConsoleRule } from "./rules/no-console.rule";
import { NoThrowInDomainRule } from "./rules/no-throw-in-domain.rule";
import { NoDirectDomainInstantiationRule } from "./rules/no-direct-domain-instantiation.rule";
import { NoNumericSeparatorRule } from "./rules/no-numeric-separator.rule";
import { NoPrettierIgnoreRule } from "./rules/no-prettier-ignore.rule";

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
    ];
  }

  static getDefaultRuleNames(): string[] {
    return RuleRegistry.createDefault().map(r => r.name);
  }

  static getDefaultRuleCount(): number {
    return RuleRegistry.createDefault().length;
  }

  private readonly rules: Rule[] = [];
  private readonly severityOverrides = new Map<string, "error" | "warning" | "off">();

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
    return this.rules.filter(rule => {
      const override = this.severityOverrides.get(rule.name);
      return override !== "off";
    });
  }

  getSeverity(ruleName: string, defaultSeverity: "error" | "warning"): "error" | "warning" {
    const override = this.severityOverrides.get(ruleName);
    if (override === "error" || override === "warning") return override;
    return defaultSeverity;
  }
}
