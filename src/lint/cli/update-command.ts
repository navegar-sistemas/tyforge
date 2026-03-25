import * as path from "node:path";
import { ToolPrompt, ReadlinePromptIO } from "./prompt.tool";
import { ToolDetect } from "./detect.tool";
import { loadLintConfigExtended } from "../config/lint-config-loader";
import { ConfigWriter } from "../config/lint-config-writer";
import type { ILintConfigExtended } from "../config/lint-config-schema";

import { NoAnyRule } from "../rules/no-any.rule";
import { NoCastRule } from "../rules/no-cast.rule";
import { NoNonNullRule } from "../rules/no-non-null.rule";
import { NoTsIgnoreRule } from "../rules/no-ts-ignore.rule";
import { NoExportDefaultRule } from "../rules/no-export-default.rule";
import { NoToJsonLowercaseRule } from "../rules/no-to-json-lowercase.rule";
import { NoNewTypeFieldRule } from "../rules/no-new-type-field.rule";
import { NoMagicHttpStatusRule } from "../rules/no-magic-http-status.rule";
import { NoDeclareRule } from "../rules/no-declare.rule";
import { NoSatisfiesWithoutPrefixRule } from "../rules/no-satisfies-without-prefix.rule";

function getAllRuleNames(): ReadonlyArray<string> {
  const rules = [
    new NoAnyRule(),
    new NoCastRule(),
    new NoNonNullRule(),
    new NoTsIgnoreRule(),
    new NoExportDefaultRule(),
    new NoToJsonLowercaseRule(),
    new NoNewTypeFieldRule(),
    new NoMagicHttpStatusRule(),
    new NoDeclareRule(),
    new NoSatisfiesWithoutPrefixRule(),
  ];
  return rules.map(r => r.name);
}

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
      prompt.printInfo("No existing config found. Run `npx tyforge-lint --init` first.");
      return;
    }

    const allRuleNames = getAllRuleNames();
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

    const configPath = path.resolve(process.cwd(), "tyforge-lint.config.json");
    ConfigWriter.write(updatedConfig, configPath);
    prompt.printSuccess("Config updated with new rules.");
  }
}
