import * as fs from "node:fs";
import * as nodePath from "node:path";
import { Result, ok, err, isFailure } from "@tyforge/result";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { ExceptionGeneric } from "@tyforge/exceptions/generic.exception";
import { OHttpStatus } from "@tyforge/constants/http-status.constants";
import { TypeGuard } from "@tyforge/tools/type_guard";
import type { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";

export const OValidateLevel = {
  FULL: "full",
  TYPE: "type",
  NONE: "none",
} as const;
export const ORuleSeverity = {
  ERROR: "error",
  WARNING: "warning",
  OFF: "off",
} as const;
export type TRuleSeverity = (typeof ORuleSeverity)[keyof typeof ORuleSeverity];

export interface ILintConfigSection {
  root?: string;
  strict?: boolean;
  exclude?: string[];
  rules?: Record<string, TRuleSeverity>;
}

export interface ITyForgeConfig {
  schema?: {
    validate?: {
      create?: TValidationLevel;
      assign?: TValidationLevel;
    };
  };
  lint?: ILintConfigSection;
}

export interface IResolvedTyForgeConfig {
  schema: {
    validate: {
      create: TValidationLevel;
      assign: TValidationLevel;
    };
  };
  lint?: Record<string, unknown>;
}

const ALLOWED_CONFIG_NAMES = new Set([
  "tyforge.config.json",
  "tyforge-lint.config.json",
]);
const ABSOLUTE_URL_REGEX = /^(?:[a-z]+:)?\/\//i;
const PATH_TRAVERSAL_REGEX = /(?:^|[/\\])\.\.(?:[/\\]|$)/;
const NULL_BYTE_REGEX = /\0/;
const MAX_CONFIG_SIZE = 1048576;

const DEFAULTS: IResolvedTyForgeConfig = {
  schema: { validate: { create: "full", assign: "type" } },
};

export class TyForgeConfig {
  private static cached: IResolvedTyForgeConfig | null = null;

  private constructor() {}

  static load(configPath?: string): Result<IResolvedTyForgeConfig, Exceptions> {
    if (TyForgeConfig.cached !== null && configPath === undefined) {
      return ok(TyForgeConfig.cached);
    }

    const filePath =
      configPath ?? nodePath.resolve(process.cwd(), "tyforge.config.json");

    if (!TyForgeConfig.validatePath(filePath)) {
      if (configPath === undefined) TyForgeConfig.cached = DEFAULTS;
      return ok(DEFAULTS);
    }

    try {
      const stat = fs.statSync(filePath);
      if (stat.size > MAX_CONFIG_SIZE) {
        return err(
          ExceptionGeneric.create(
            OHttpStatus.BAD_REQUEST,
            {},
            "Config file exceeds 1MB limit.",
          ),
        );
      }

      const content = fs.readFileSync(filePath, "utf-8");
      const parsed: unknown = JSON.parse(content);
      if (!TypeGuard.isRecord(parsed)) {
        return err(
          ExceptionGeneric.create(
            OHttpStatus.BAD_REQUEST,
            {},
            "Config file must be a JSON object.",
          ),
        );
      }

      const resolved = TyForgeConfig.resolve(parsed);
      if (isFailure(resolved)) return resolved;
      if (configPath === undefined) TyForgeConfig.cached = resolved.value;
      return resolved;
    } catch {
      if (configPath === undefined) TyForgeConfig.cached = DEFAULTS;
      return ok(DEFAULTS);
    }
  }

  static get(): IResolvedTyForgeConfig | null {
    return TyForgeConfig.cached;
  }

  static clearCache(): void {
    TyForgeConfig.cached = null;
  }

  private static validatePath(filePath: string): boolean {
    if (NULL_BYTE_REGEX.test(filePath)) return false;
    if (ABSOLUTE_URL_REGEX.test(filePath)) return false;
    if (PATH_TRAVERSAL_REGEX.test(filePath)) return false;
    if (!filePath.endsWith(".json")) return false;
    const basename = nodePath.basename(filePath);
    if (!ALLOWED_CONFIG_NAMES.has(basename)) return false;

    try {
      const realPath = fs.realpathSync(filePath);
      if (realPath !== filePath && PATH_TRAVERSAL_REGEX.test(realPath))
        return false;
    } catch {
      return false;
    }

    return true;
  }

  private static resolveValidateLevel(
    value: unknown,
    fieldName: string,
    defaultValue: TValidationLevel,
  ): Result<TValidationLevel, Exceptions> {
    if (value === undefined) return ok(defaultValue);
    const str = TypeGuard.isString(value, fieldName);
    if (isFailure(str))
      return err(
        ExceptionGeneric.create(OHttpStatus.BAD_REQUEST, {}, str.error.detail),
      );
    const enumCheck = TypeGuard.isEnumValue(
      OValidateLevel,
      str.value,
      fieldName,
    );
    if (isFailure(enumCheck))
      return err(
        ExceptionGeneric.create(
          OHttpStatus.BAD_REQUEST,
          {},
          enumCheck.error.detail,
        ),
      );
    if (str.value === "full" || str.value === "type" || str.value === "none")
      return ok(str.value);
    return err(
      ExceptionGeneric.create(
        OHttpStatus.BAD_REQUEST,
        {},
        `${fieldName}: invalid value`,
      ),
    );
  }

  private static resolve(
    raw: Record<string, unknown>,
  ): Result<IResolvedTyForgeConfig, Exceptions> {
    const schema = TypeGuard.isRecord(raw["schema"]) ? raw["schema"] : {};
    const validate = TypeGuard.isRecord(schema["validate"])
      ? schema["validate"]
      : {};

    const createLevel = TyForgeConfig.resolveValidateLevel(
      validate["create"],
      "schema.validate.create",
      "full",
    );
    if (isFailure(createLevel)) return createLevel;

    const assignLevel = TyForgeConfig.resolveValidateLevel(
      validate["assign"],
      "schema.validate.assign",
      "type",
    );
    if (isFailure(assignLevel)) return assignLevel;

    return ok({
      schema: {
        validate: {
          create: createLevel.value,
          assign: assignLevel.value,
        },
      },
      lint: TypeGuard.isRecord(raw["lint"]) ? raw["lint"] : undefined,
    });
  }
}

// Backwards-compatible function exports — delegate to class methods
export function loadTyForgeConfig(configPath?: string): IResolvedTyForgeConfig {
  const result = TyForgeConfig.load(configPath);
  if (isFailure(result)) return DEFAULTS;
  return result.value;
}

export function getTyForgeConfig(): IResolvedTyForgeConfig | null {
  return TyForgeConfig.get();
}

export function clearConfigCache(): void {
  TyForgeConfig.clearCache();
}
