import * as fs from "node:fs";
import * as path from "node:path";
import { ToolDetect } from "./detect.tool";
import { ToolPrompt, ReadlinePromptIO } from "./prompt.tool";
import { loadLintConfigExtended } from "../config/lint-config-loader";
import { HookManagerFactory } from "../hooks/hook-manager-factory";
import type { THookManager } from "../config/lint-config-schema";
import { OHookManager } from "../config/lint-config-schema";

function detectedToHookManager(detected: string): THookManager | undefined {
  if (detected === "husky") return OHookManager.HUSKY;
  if (detected === "lefthook") return OHookManager.LEFTHOOK;
  if (detected === "native") return OHookManager.NATIVE;
  return undefined;
}

export class UninstallCommand {
  async execute(): Promise<void> {
    const cwd = process.cwd();

    if (!ToolDetect.isTTY()) {
      console.error(
        "tyforge-guard --uninstall requires an interactive terminal (TTY).",
      );
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

    const config = loadLintConfigExtended();
    const hookManagerType =
      config?.hookManager ??
      detectedToHookManager(ToolDetect.detectHookManager(cwd));

    if (hookManagerType) {
      const manager = HookManagerFactory.create(hookManagerType);

      if (manager.isInstalled(cwd)) {
        const removeHook = await prompt.confirm(
          `Remove ${manager.name} pre-commit hook?`,
        );
        if (removeHook) {
          const result = manager.remove(cwd);
          if (result.success) {
            prompt.printSuccess(result.message);
          } else {
            prompt.printInfo(result.message);
          }
        }
      } else {
        prompt.printInfo("No tyforge-guard hook found installed.");
      }
    } else {
      prompt.printInfo("No hook manager detected.");
    }

    const configPath = path.resolve(cwd, "tyforge-guard.config.json");
    if (fs.existsSync(configPath)) {
      const removeConfig = await prompt.confirm(
        "Remove tyforge-guard.config.json?",
        false,
      );
      if (removeConfig) {
        try {
          fs.unlinkSync(configPath);
          prompt.printSuccess("Config file removed.");
        } catch {
          prompt.printInfo("Could not remove tyforge-guard.config.json");
        }
      } else {
        prompt.printInfo("Config file kept.");
      }
    }

    prompt.printSuccess("Uninstall complete.");
  }
}
