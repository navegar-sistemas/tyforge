import * as fs from "node:fs";
import * as path from "node:path";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { ToolObjectTransform } from "@tyforge/tools/object-transform.tool";
import type { ILintConfigExtended, THookManager } from "./lint-config-schema";
import { OHookManager } from "./lint-config-schema";

const OLintSeverity = { ERROR: "error", WARNING: "warning", OFF: "off" } as const;

function isHookManager(value: string): value is THookManager {
  return value === OHookManager.HUSKY || value === OHookManager.LEFTHOOK || value === OHookManager.NATIVE;
}

export function loadLintConfigExtended(configPath?: string): ILintConfigExtended | null {
  const paths = configPath
    ? [path.resolve(configPath)]
    : [
        path.resolve(process.cwd(), "tyforge-lint.config.json"),
        path.resolve(process.cwd(), "tyforge.config.json"),
      ];

  for (const filePath of paths) {
    let content: string;
    try {
      const stat = fs.statSync(filePath);
      if (stat.size > 1048576) throw new Error("Config file exceeds 1MB limit.");
      content = fs.readFileSync(filePath, "utf-8");
    } catch (err) {
      if (err instanceof Error && err.message === "Config file exceeds 1MB limit.") throw err;
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      continue;
    }
    if (!TypeGuard.isRecord(parsed)) continue;

    const source = filePath.endsWith("tyforge.config.json") && TypeGuard.isRecord(parsed["lint"])
      ? parsed["lint"]
      : parsed;

    if (!TypeGuard.isRecord(source)) continue;
    return buildExtendedConfig(source);
  }

  return null;
}

function buildExtendedConfig(source: Record<string, unknown>): ILintConfigExtended {
  const defaults = { root: "src", strict: true, exclude: [], version: "1.0" };
  const merged = { ...defaults, ...source };
  const flat = ToolObjectTransform.flatten(merged);

  const rootResult = TypeGuard.isString(flat.get("root"), "root");
  const root = rootResult.success ? rootResult.value : "src";

  const strictResult = TypeGuard.extractBoolean(flat.get("strict"), "strict");
  const strict = strictResult.success ? strictResult.value : true;

  const versionResult = TypeGuard.isString(flat.get("version"), "version");
  const version = versionResult.success ? versionResult.value : "1.0";

  const excludeResult = TypeGuard.extractArray(flat.get("exclude"), "exclude");
  const exclude: string[] = [];
  if (excludeResult.success) {
    for (const item of excludeResult.value) {
      const strCheck = TypeGuard.isString(item, "exclude[]");
      if (strCheck.success) exclude.push(strCheck.value);
    }
  }

  const rules: Record<string, "error" | "warning" | "off"> = {};
  for (const [key, value] of flat) {
    if (!key.startsWith("rules.")) continue;
    const str = TypeGuard.isString(value, key);
    if (!str.success) continue;
    const enumCheck = TypeGuard.isEnumValue(OLintSeverity, str.value, key);
    if (!enumCheck.success) continue;
    if (str.value === "error" || str.value === "warning" || str.value === "off") {
      rules[key.slice(6)] = str.value;
    }
  }

  const hookManagerStr = flat.get("hookManager");
  let hookManager: THookManager | undefined;
  if (hookManagerStr !== undefined) {
    const hmCheck = TypeGuard.isString(hookManagerStr, "hookManager");
    if (hmCheck.success && isHookManager(hmCheck.value)) {
      hookManager = hmCheck.value;
    }
  }

  const config: ILintConfigExtended = { version, root, strict, exclude, rules };

  if (hookManager) {
    return { ...config, hookManager };
  }

  const meta = source["_meta"];
  if (TypeGuard.isRecord(meta)) {
    const configuredAt = TypeGuard.isString(meta["configuredAt"], "_meta.configuredAt");
    const tyforgeVersion = TypeGuard.isString(meta["tyforgeVersion"], "_meta.tyforgeVersion");
    const lastRulesCount = TypeGuard.extractNumber(meta["lastRulesCount"], "_meta.lastRulesCount");

    if (configuredAt.success && tyforgeVersion.success && lastRulesCount.success) {
      return {
        ...config,
        ...(hookManager ? { hookManager } : {}),
        _meta: {
          configuredAt: configuredAt.value,
          tyforgeVersion: tyforgeVersion.value,
          lastRulesCount: lastRulesCount.value,
        },
      };
    }
  }

  return config;
}
