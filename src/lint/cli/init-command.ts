import * as path from "node:path";
import { ToolDetect, OHookManagerType } from "./detect.tool";
import type { THookManagerDetected } from "./detect.tool";
import { ToolPrompt, ReadlinePromptIO } from "./prompt.tool";
import { ConfigWriter } from "../config/lint-config-writer";
import { HookManagerFactory } from "../hooks/hook-manager-factory";
import type { THookManager, ILintConfigExtended } from "../config/lint-config-schema";
import { OHookManager } from "../config/lint-config-schema";

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

function detectedToHookManager(detected: THookManagerDetected): THookManager | undefined {
  if (detected === OHookManagerType.HUSKY) return OHookManager.HUSKY;
  if (detected === OHookManagerType.LEFTHOOK) return OHookManager.LEFTHOOK;
  if (detected === OHookManagerType.NATIVE) return OHookManager.NATIVE;
  return undefined;
}

export class InitCommand {
  async execute(): Promise<void> {
    const cwd = process.cwd();

    if (!ToolDetect.isTTY()) {
      console.error("tyforge-lint --init requires an interactive terminal (TTY).");
      return;
    }

    if (!ToolDetect.isGitRepo(cwd)) {
      console.error("tyforge-lint --init requires a git repository.");
      return;
    }

    const io = new ReadlinePromptIO();
    const prompt = new ToolPrompt(io);

    try {
      await this.run(prompt, cwd);
    } finally {
      prompt.close();
    }
  }

  private async run(prompt: ToolPrompt, cwd: string): Promise<void> {
    prompt.printBanner();

    const enableHook = await prompt.confirm("Enable pre-commit hook?");

    let hookManager: THookManager | undefined;
    if (enableHook) {
      const detected = ToolDetect.detectHookManager(cwd);
      const defaultManager = detectedToHookManager(detected);

      hookManager = await prompt.select<THookManager>("Select hook manager:", [
        { label: "Husky", value: OHookManager.HUSKY, recommended: detected === OHookManagerType.HUSKY },
        { label: "Lefthook", value: OHookManager.LEFTHOOK, recommended: detected === OHookManagerType.LEFTHOOK },
        { label: "Native git hooks", value: OHookManager.NATIVE, recommended: defaultManager === undefined || detected === OHookManagerType.NATIVE },
      ]);
    }

    const root = await prompt.input("Source root directory", "src");
    const strict = await prompt.confirm("Enable strict mode (warnings also fail)?");

    const ruleNames = getAllRuleNames();
    const rules: Record<string, "error" | "warning" | "off"> = {};
    for (const name of ruleNames) {
      rules[name] = "error";
    }

    const actions: string[] = [];
    actions.push("Write tyforge-lint.config.json");
    if (enableHook && hookManager) {
      actions.push(`Setup ${hookManager} pre-commit hook`);
    }

    prompt.printPreview(actions);

    const proceed = await prompt.confirm("Proceed?");
    if (!proceed) {
      prompt.printInfo("Aborted.");
      return;
    }

    const config: ILintConfigExtended = {
      version: "1.0",
      root,
      strict,
      exclude: [],
      rules,
      ...(hookManager ? { hookManager } : {}),
      _meta: {
        configuredAt: new Date().toISOString(),
        tyforgeVersion: ToolDetect.getPackageVersion(),
        lastRulesCount: ruleNames.length,
      },
    };

    const configPath = path.resolve(cwd, "tyforge-lint.config.json");
    ConfigWriter.write(config, configPath);
    prompt.printSuccess("Config written to tyforge-lint.config.json");

    if (enableHook && hookManager) {
      const manager = HookManagerFactory.create(hookManager);
      const result = manager.setup("npx tyforge-lint --staged", cwd);

      if (result.success) {
        prompt.printSuccess(result.message);
      } else {
        prompt.printInfo(result.message);
      }

      if (result.manualSteps.length > 0) {
        prompt.printInfo("Manual steps required:");
        for (const step of result.manualSteps) {
          prompt.printInfo(`  ${step}`);
        }
      }
    }

    prompt.printSuccess("Setup complete!");
  }
}
