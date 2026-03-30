import * as fs from "node:fs";
import * as path from "node:path";
import type { IHookManager, IHookSetupResult } from "./hook-manager.interface";

const HOOK_MARKER = "tyforge-guard";

const LEFTHOOK_FILENAMES = ["lefthook.yml", "lefthook.yaml"];

export class HookSetupLefthook implements IHookManager {
  readonly name = "lefthook";

  setup(command: string, cwd: string): IHookSetupResult {
    const hookPath = this.resolveConfigPath(cwd);

    try {
      if (fs.existsSync(hookPath)) {
        const existing = fs.readFileSync(hookPath, "utf-8");
        if (existing.includes(HOOK_MARKER)) {
          return {
            success: true,
            hookPath,
            message: "Lefthook config already contains tyforge-guard",
            manualSteps: [],
          };
        }

        const block = this.buildBlock(command);
        const updated = this.appendToPreCommit(existing, block);
        fs.writeFileSync(hookPath, updated, "utf-8");
      } else {
        const content = this.buildFullConfig(command);
        fs.writeFileSync(hookPath, content, "utf-8");
      }

      return {
        success: true,
        hookPath,
        message: "Lefthook pre-commit hook installed",
        manualSteps: [],
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        hookPath,
        message: `Failed to install lefthook hook: ${msg}`,
        manualSteps: [
          `Manually add a tyforge-guard command to ${hookPath} under pre-commit`,
        ],
      };
    }
  }

  remove(cwd: string): IHookSetupResult {
    const hookPath = this.resolveConfigPath(cwd);

    try {
      if (!fs.existsSync(hookPath)) {
        return {
          success: true,
          hookPath,
          message: "No lefthook config found",
          manualSteps: [],
        };
      }

      const content = fs.readFileSync(hookPath, "utf-8");
      if (!content.includes(HOOK_MARKER)) {
        return {
          success: true,
          hookPath,
          message: "Lefthook config does not contain tyforge-guard",
          manualSteps: [],
        };
      }

      const cleaned = this.removeTyforgeLintBlock(content);
      const trimmed = cleaned.trim();

      if (trimmed === "" || trimmed === "pre-commit:" || trimmed === "pre-commit:\n  commands:") {
        fs.unlinkSync(hookPath);
      } else {
        fs.writeFileSync(hookPath, cleaned, "utf-8");
      }

      return {
        success: true,
        hookPath,
        message: "Lefthook tyforge-guard block removed",
        manualSteps: [],
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        hookPath,
        message: `Failed to remove lefthook hook: ${msg}`,
        manualSteps: [`Manually remove tyforge-guard block from ${hookPath}`],
      };
    }
  }

  isInstalled(cwd: string): boolean {
    const hookPath = this.resolveConfigPath(cwd);
    if (!fs.existsSync(hookPath)) return false;
    const content = fs.readFileSync(hookPath, "utf-8");
    return content.includes(HOOK_MARKER);
  }

  private resolveConfigPath(cwd: string): string {
    for (const filename of LEFTHOOK_FILENAMES) {
      const candidate = path.resolve(cwd, filename);
      if (fs.existsSync(candidate)) return candidate;
    }
    return path.resolve(cwd, LEFTHOOK_FILENAMES[0]);
  }

  private buildBlock(command: string): string {
    return [
      "    tyforge-guard:",
      `      run: ${command}`,
    ].join("\n");
  }

  private buildFullConfig(command: string): string {
    return [
      "pre-commit:",
      "  commands:",
      this.buildBlock(command),
      "",
    ].join("\n");
  }

  private appendToPreCommit(existing: string, block: string): string {
    if (existing.includes("pre-commit:")) {
      if (existing.includes("commands:")) {
        return existing.trimEnd() + "\n" + block + "\n";
      }
      return existing.trimEnd() + "\n  commands:\n" + block + "\n";
    }
    return existing.trimEnd() + "\n" + this.buildFullConfig(block) + "\n";
  }

  private removeTyforgeLintBlock(content: string): string {
    const lines = content.split("\n");
    const result: string[] = [];
    let skipping = false;

    for (const line of lines) {
      if (line.includes("tyforge-guard:")) {
        skipping = true;
        continue;
      }

      if (skipping) {
        if (line.startsWith("      ") || line.trim() === "") {
          continue;
        }
        skipping = false;
      }

      result.push(line);
    }

    return result.join("\n");
  }
}
