import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { TypeGuard } from "@tyforge/tools/type_guard";

const CI_ENV_VARS = [
  "CI",
  "GITHUB_ACTIONS",
  "GITLAB_CI",
  "JENKINS_URL",
  "CIRCLECI",
  "TRAVIS",
  "BITBUCKET_BUILD_NUMBER",
  "CODEBUILD_BUILD_ID",
  "VERCEL",
  "NETLIFY",
];

export const OHookManagerType = {
  HUSKY: "husky",
  LEFTHOOK: "lefthook",
  NATIVE: "native",
  NONE: "none",
} as const;

export type THookManagerDetected = typeof OHookManagerType[keyof typeof OHookManagerType];

export class ToolDetect {
  static isCI(): boolean {
    return CI_ENV_VARS.some(v => process.env[v] !== undefined);
  }

  static isTTY(): boolean {
    return process.stdin.isTTY === true && process.stdout.isTTY === true;
  }

  static isGitRepo(cwd: string): boolean {
    return fs.existsSync(path.resolve(cwd, ".git"));
  }

  static detectHookManager(cwd: string): THookManagerDetected {
    if (fs.existsSync(path.resolve(cwd, ".husky"))) return OHookManagerType.HUSKY;
    if (fs.existsSync(path.resolve(cwd, "lefthook.yml"))) return OHookManagerType.LEFTHOOK;
    if (fs.existsSync(path.resolve(cwd, "lefthook.yaml"))) return OHookManagerType.LEFTHOOK;
    const nativeHook = path.resolve(cwd, ".git", "hooks", "pre-commit");
    if (fs.existsSync(nativeHook)) return OHookManagerType.NATIVE;
    return OHookManagerType.NONE;
  }

  static hasExistingConfig(cwd: string): boolean {
    if (fs.existsSync(path.resolve(cwd, "tyforge-lint.config.json"))) return true;
    if (fs.existsSync(path.resolve(cwd, "tyforge.config.json"))) return true;
    return false;
  }

  static getPackageVersion(): string {
    try {
      const currentDir = path.dirname(fileURLToPath(import.meta.url));
      const pkgPath = path.resolve(currentDir, "..", "..", "..", "package.json");
      const content = fs.readFileSync(pkgPath, "utf-8");
      const parsed: unknown = JSON.parse(content);
      if (TypeGuard.isRecord(parsed)) {
        const version = parsed["version"];
        const check = TypeGuard.isString(version, "version");
        if (check.success) return check.value;
      }
      return "unknown";
    } catch {
      return "unknown";
    }
  }
}
