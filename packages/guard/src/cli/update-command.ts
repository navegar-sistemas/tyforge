import * as path from "node:path";
import { ToolPrompt, ReadlinePromptIO } from "./prompt.tool";
import { ToolDetect } from "./detect.tool";
import { loadLintConfigExtended } from "../config/lint-config-loader";
import { ConfigWriter } from "../config/lint-config-writer";
import type { ILintConfigExtended } from "../config/lint-config-schema";
import { RuleRegistry } from "../rule-registry";

export class UpdateCommand {
  async execute(): Promise<void> {
    const io = new ReadlinePromptIO();
    const prompt = new ToolPrompt(io);

    try {
      await this.run(prompt);
    } finally {
      prompt.close();
    }
  }

  private async run(prompt: ToolPrompt): Promise<void> {
    prompt.printBanner();

    const existing = loadLintConfigExtended();
    if (!existing) {
      prompt.printInfo("No existing config found. Run `npx tyforge-guard --init` first.");
      return;
    }

    const allRuleNames = RuleRegistry.getDefaultRuleNames();
    const existingRuleNames = new Set(Object.keys(existing.rules));
    const newRuleNames: string[] = [];

    for (const name of allRuleNames) {
      if (!existingRuleNames.has(name)) {
        newRuleNames.push(name);
      }
    }

    if (newRuleNames.length === 0) {
      prompt.printSuccess("All rules are up to date. No new rules found.");
      return;
    }

    prompt.printInfo(`Found ${newRuleNames.length} new rule(s):`);

    const newRules: Record<string, "error" | "warning" | "off"> = {};
    for (const name of newRuleNames) {
      const severity = await prompt.select<"error" | "warning" | "off">(
        `Rule "${name}":`,
        [
          { label: "error", value: "error", recommended: true },
          { label: "warning", value: "warning" },
          { label: "off", value: "off" },
        ],
      );
      newRules[name] = severity;
    }

    const preservedCount = Object.keys(existing.rules).length;
    prompt.printInfo(`${preservedCount} existing rule(s) preserved.`);

    const updatedRules: Record<string, "error" | "warning" | "off"> = {
      ...existing.rules,
      ...newRules,
    };

    const updatedConfig: ILintConfigExtended = {
      ...existing,
      rules: updatedRules,
      _meta: {
        configuredAt: new Date().toISOString(),
        tyforgeVersion: ToolDetect.getPackageVersion(),
        lastRulesCount: allRuleNames.length,
      },
    };

    const configPath = path.resolve(process.cwd(), "tyforge-guard.config.json");
    ConfigWriter.write(updatedConfig, configPath);
    prompt.printSuccess("Config updated with new rules.");
  }
}
