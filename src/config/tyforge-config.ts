import * as fs from "node:fs";
import * as path from "node:path";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { ToolObjectTransform } from "@tyforge/tools/object-transform.tool";
import { isFailure } from "@tyforge/result";
import type { TValidationLevel } from "@tyforge/type-fields/type-field.base";

export interface ITyForgeConfig {
  schema: {
    validate: {
      create: TValidationLevel;
      assign: TValidationLevel;
    };
  };
  lint?: Record<string, unknown>;
}

const OValidateLevel = { FULL: "full", TYPE: "type", NONE: "none" } as const;

function validateLevel(
  flat: Map<string, unknown>,
  key: string,
  defaultValue: TValidationLevel,
): TValidationLevel {
  const val = flat.get(key);
  if (val === undefined) return defaultValue;
  const str = TypeGuard.isString(val, key);
  if (isFailure(str)) throw new Error(str.error.detail);
  const enumCheck = TypeGuard.isEnumValue(OValidateLevel, str.value, key);
  if (isFailure(enumCheck)) throw new Error(enumCheck.error.detail);
  if (str.value === "full" || str.value === "type" || str.value === "none") return str.value;
  throw new Error(`${key}: invalid value`);
}

function validateAndBuildConfig(raw: unknown, filePath: string): ITyForgeConfig {
  if (!TypeGuard.isRecord(raw)) throw new Error(`${filePath}: root must be a JSON object`);

  const allowedTopKeys = new Set(["schema", "lint"]);
  for (const key of Object.keys(raw)) {
    if (!allowedTopKeys.has(key)) {
      throw new Error(`${filePath}: unknown config key "${key}"`);
    }
  }

  const flat = ToolObjectTransform.flatten(raw);

  const lint = raw["lint"];

  return {
    schema: {
      validate: {
        create: validateLevel(flat, "schema.validate.create", "full"),
        assign: validateLevel(flat, "schema.validate.assign", "type"),
      },
    },
    lint: TypeGuard.isRecord(lint) ? lint : undefined,
  };
}

export function loadTyForgeConfig(configPath?: string): ITyForgeConfig {
  const filePath = configPath ?? path.resolve(process.cwd(), "tyforge.config.json");
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return { schema: { validate: { create: "full", assign: "type" } } };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`${filePath}: invalid JSON`);
  }
  return validateAndBuildConfig(parsed, filePath);
}
