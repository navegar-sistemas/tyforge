import { TypeGuard } from "@tyforge/tools/type_guard";
import { ToolObjectTransform } from "@tyforge/tools/object-transform.tool";
import { isFailure } from "@tyforge/result";
import { loadTyForgeConfig } from "@tyforge/config/tyforge-config";

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

export function loadLintConfig(configPath?: string): ILintConfig {
  const config = loadTyForgeConfig(configPath);
  if (config.lint && TypeGuard.isRecord(config.lint)) {
    return validateAndBuildLintConfig(config.lint);
  }
  return validateAndBuildLintConfig({});
}
