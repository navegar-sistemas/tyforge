import * as fs from "node:fs";
import * as path from "node:path";
import { TypeGuard } from "@tyforge/tools/type_guard";
import type { IHookManager, IHookSetupResult } from "./hook-manager.interface";

const HOOK_MARKER = "tyforge-lint";

export class HookSetupHusky implements IHookManager {
  readonly name = "husky";

  setup(command: string, cwd: string): IHookSetupResult {
    const hookPath = path.resolve(cwd, ".husky", "pre-commit");
    const huskyDir = path.resolve(cwd, ".husky");
    const manualSteps: string[] = [];

    try {
      if (!fs.existsSync(huskyDir)) {
        fs.mkdirSync(huskyDir, { recursive: true });
      }

      if (fs.existsSync(hookPath)) {
        const existing = fs.readFileSync(hookPath, "utf-8");
        if (existing.includes(HOOK_MARKER)) {
          return {
            success: true,
            hookPath,
            message: "Husky pre-commit hook already contains tyforge-lint",
            manualSteps: [],
          };
        }
        const appended = existing.trimEnd() + "\n" + command + "\n";
        fs.writeFileSync(hookPath, appended, { mode: 0o755 });
      } else {
        fs.writeFileSync(hookPath, `${command}\n`, { mode: 0o755 });
      }

      if (!this.hasPrepareScript(cwd)) {
        manualSteps.push(
          'Add "prepare": "husky" to the "scripts" section in package.json',
        );
      }

      return {
        success: true,
        hookPath,
        message: "Husky pre-commit hook installed",
        manualSteps,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        hookPath,
        message: `Failed to install husky hook: ${msg}`,
        manualSteps: [
          `Manually create ${hookPath} with:\n${command}`,
          `Run: chmod 755 ${hookPath}`,
        ],
      };
    }
  }

  remove(cwd: string): IHookSetupResult {
    const hookPath = path.resolve(cwd, ".husky", "pre-commit");

    try {
      if (!fs.existsSync(hookPath)) {
        return {
          success: true,
          hookPath,
          message: "No husky pre-commit hook found",
          manualSteps: [],
        };
      }

      const content = fs.readFileSync(hookPath, "utf-8");
      if (!content.includes(HOOK_MARKER)) {
        return {
          success: true,
          hookPath,
          message: "Husky pre-commit hook does not contain tyforge-lint",
          manualSteps: [],
        };
      }

      fs.unlinkSync(hookPath);

      return {
        success: true,
        hookPath,
        message: "Husky pre-commit hook removed",
        manualSteps: [],
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        hookPath,
        message: `Failed to remove husky hook: ${msg}`,
        manualSteps: [`Manually delete ${hookPath}`],
      };
    }
  }

  isInstalled(cwd: string): boolean {
    const hookPath = path.resolve(cwd, ".husky", "pre-commit");
    if (!fs.existsSync(hookPath)) return false;
    const content = fs.readFileSync(hookPath, "utf-8");
    return content.includes(HOOK_MARKER);
  }

  private hasPrepareScript(cwd: string): boolean {
    const pkgPath = path.resolve(cwd, "package.json");
    if (!fs.existsSync(pkgPath)) return false;

    try {
      const content = fs.readFileSync(pkgPath, "utf-8");
      const parsed: unknown = JSON.parse(content);
      if (!TypeGuard.isRecord(parsed)) return false;

      const scripts = parsed["scripts"];
      if (!TypeGuard.isRecord(scripts)) return false;

      const prepare = scripts["prepare"];
      const check = TypeGuard.isString(prepare, "scripts.prepare");
      return check.success;
    } catch {
      return false;
    }
  }
}
