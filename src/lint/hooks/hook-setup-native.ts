import * as fs from "node:fs";
import * as path from "node:path";
import type { IHookManager, IHookSetupResult } from "./hook-manager.interface";

const HOOK_MARKER = "tyforge-lint";
const BACKUP_SUFFIX = ".tyforge-backup";

export class HookSetupNative implements IHookManager {
  readonly name = "native";

  setup(command: string, cwd: string): IHookSetupResult {
    const hookPath = path.resolve(cwd, ".git", "hooks", "pre-commit");
    const hookDir = path.dirname(hookPath);

    try {
      if (!fs.existsSync(hookDir)) {
        fs.mkdirSync(hookDir, { recursive: true });
      }

      if (fs.existsSync(hookPath)) {
        const existing = fs.readFileSync(hookPath, "utf-8");
        if (existing.includes(HOOK_MARKER)) {
          return {
            success: true,
            hookPath,
            message: "Pre-commit hook already contains tyforge-lint",
            manualSteps: [],
          };
        }
        fs.copyFileSync(hookPath, hookPath + BACKUP_SUFFIX);
      }

      const content = `#!/bin/sh\n${command}\n`;
      fs.writeFileSync(hookPath, content, { mode: 0o755 });

      return {
        success: true,
        hookPath,
        message: "Native pre-commit hook installed",
        manualSteps: [],
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        hookPath,
        message: `Failed to install native hook: ${msg}`,
        manualSteps: [
          `Manually create ${hookPath} with:\n#!/bin/sh\n${command}`,
          `Run: chmod 755 ${hookPath}`,
        ],
      };
    }
  }

  remove(cwd: string): IHookSetupResult {
    const hookPath = path.resolve(cwd, ".git", "hooks", "pre-commit");
    const backupPath = hookPath + BACKUP_SUFFIX;

    try {
      if (!fs.existsSync(hookPath)) {
        return {
          success: true,
          hookPath,
          message: "No pre-commit hook found",
          manualSteps: [],
        };
      }

      const content = fs.readFileSync(hookPath, "utf-8");
      if (!content.includes(HOOK_MARKER)) {
        return {
          success: true,
          hookPath,
          message: "Pre-commit hook does not contain tyforge-lint",
          manualSteps: [],
        };
      }

      fs.unlinkSync(hookPath);

      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, hookPath);
      }

      return {
        success: true,
        hookPath,
        message: "Native pre-commit hook removed",
        manualSteps: [],
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        hookPath,
        message: `Failed to remove native hook: ${msg}`,
        manualSteps: [`Manually delete ${hookPath}`],
      };
    }
  }

  isInstalled(cwd: string): boolean {
    const hookPath = path.resolve(cwd, ".git", "hooks", "pre-commit");
    if (!fs.existsSync(hookPath)) return false;
    const content = fs.readFileSync(hookPath, "utf-8");
    return content.includes(HOOK_MARKER);
  }
}
