import * as fs from "node:fs";
import * as path from "node:path";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { ToolObjectTransform } from "@tyforge/tools/object-transform.tool";
import { isFailure } from "@tyforge/result";

export interface ILintConfig {
  root: string;
  strict: boolean;
  exclude: string[];
  rules: Record<string, "error" | "warning" | "off">;
}

const OLintSeverity = { ERROR: "error", WARNING: "warning", OFF: "off" } as const;

const LINT_DEFAULTS: Record<string, unknown> = {
  root: "src",
  strict: true,
  exclude: [],
};

function validateAndBuildLintConfig(raw: Record<string, unknown>): ILintConfig {
  const merged = { ...LINT_DEFAULTS, ...raw };
  const flat = ToolObjectTransform.flatten(merged);

  const rootResult = TypeGuard.isString(flat.get("root"), "root");
  if (isFailure(rootResult)) throw new Error(rootResult.error.detail);

  const strictResult = TypeGuard.extractBoolean(flat.get("strict"), "strict");
  if (isFailure(strictResult)) throw new Error(strictResult.error.detail);

  const excludeResult = TypeGuard.extractArray(flat.get("exclude"), "exclude");
  if (isFailure(excludeResult)) throw new Error(excludeResult.error.detail);
  const exclude: string[] = [];
  for (let i = 0; i < excludeResult.value.length; i++) {
    const itemResult = TypeGuard.isString(excludeResult.value[i], `exclude[${i}]`);
    if (isFailure(itemResult)) throw new Error(itemResult.error.detail);
    exclude.push(itemResult.value);
  }

  const rules: Record<string, "error" | "warning" | "off"> = {};
  for (const [key, value] of flat) {
    if (!key.startsWith("rules.")) continue;
    const str = TypeGuard.isString(value, key);
    if (isFailure(str)) throw new Error(str.error.detail);
    const enumCheck = TypeGuard.isEnumValue(OLintSeverity, str.value, key);
    if (isFailure(enumCheck)) throw new Error(enumCheck.error.detail);
    if (str.value === "error" || str.value === "warning" || str.value === "off") {
      rules[key.slice(6)] = str.value;
    }
  }

  return {
    root: rootResult.value,
    strict: strictResult.value,
    exclude,
    rules,
  };
}

const CONFIG_FILENAME = "tyforge-lint.config.json";
const UNIFIED_CONFIG_FILENAME = "tyforge.config.json";

export function loadLintConfig(configPath?: string): ILintConfig {
  if (configPath) {
    return parseLintFile(path.resolve(configPath));
  }

  const dedicatedPath = path.resolve(process.cwd(), CONFIG_FILENAME);
  try {
    return parseLintFile(dedicatedPath);
  } catch {
    // Dedicated file not found — fall back to unified config lint section
  }

  const unifiedPath = path.resolve(process.cwd(), UNIFIED_CONFIG_FILENAME);
  return parseLintSection(unifiedPath);
}

function parseLintFile(resolvedPath: string): ILintConfig {
  const content = fs.readFileSync(resolvedPath, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`${resolvedPath}: invalid JSON`);
  }
  if (!TypeGuard.isRecord(parsed)) throw new Error(`${resolvedPath}: root must be a JSON object`);
  return validateAndBuildLintConfig(parsed);
}

function parseLintSection(resolvedPath: string): ILintConfig {
  const content = fs.readFileSync(resolvedPath, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`${resolvedPath}: invalid JSON`);
  }
  if (!TypeGuard.isRecord(parsed)) throw new Error(`${resolvedPath}: root must be a JSON object`);
  const lint = parsed["lint"];
  if (!TypeGuard.isRecord(lint)) {
    return validateAndBuildLintConfig({});
  }
  return validateAndBuildLintConfig(lint);
}
