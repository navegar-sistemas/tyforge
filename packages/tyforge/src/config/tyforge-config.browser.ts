import { Result, ok } from "@tyforge/result";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { TValidationLevel } from "@tyforge/type-fields/_base/type-field.base";

export const OValidateLevel = { FULL: "full", TYPE: "type", NONE: "none" } as const;
export const ORuleSeverity = { ERROR: "error", WARNING: "warning", OFF: "off" } as const;
export type TRuleSeverity = typeof ORuleSeverity[keyof typeof ORuleSeverity];

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

const DEFAULTS: IResolvedTyForgeConfig = { schema: { validate: { create: "full", assign: "type" } } };

export class TyForgeConfig {
  private constructor() {}

  static load(_configPath?: string): Result<IResolvedTyForgeConfig, Exceptions> {
    return ok(DEFAULTS);
  }

  static get(): IResolvedTyForgeConfig | null {
    return DEFAULTS;
  }

  static clearCache(): void {}
}

export function loadTyForgeConfig(_configPath?: string): IResolvedTyForgeConfig {
  return DEFAULTS;
}

export function getTyForgeConfig(): IResolvedTyForgeConfig | null {
  return DEFAULTS;
}

export function clearConfigCache(): void {}
