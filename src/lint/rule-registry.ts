import type { Rule } from "./rule";

export class RuleRegistry {
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
