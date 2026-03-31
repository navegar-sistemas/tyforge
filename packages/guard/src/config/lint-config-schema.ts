import type { ILintConfig } from "../config";

export const OHookManager = {
  HUSKY: "husky",
  LEFTHOOK: "lefthook",
  NATIVE: "native",
} as const;
export type THookManager = (typeof OHookManager)[keyof typeof OHookManager];

export interface ILintConfigMeta {
  readonly configuredAt: string;
  readonly tyforgeVersion: string;
  readonly lastRulesCount: number;
}

export interface ILintConfigExtended extends ILintConfig {
  readonly version: string;
  readonly hookManager?: THookManager;
  readonly _meta?: ILintConfigMeta;
}
