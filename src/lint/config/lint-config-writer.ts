import * as fs from "node:fs";
import type { ILintConfigExtended } from "./lint-config-schema";

const CANONICAL_KEY_ORDER: ReadonlyArray<keyof ILintConfigExtended> = [
  "version",
  "root",
  "strict",
  "hookManager",
  "exclude",
  "rules",
  "_meta",
];

export class ConfigWriter {
  static write(config: ILintConfigExtended, filePath: string): void {
    const ordered = ConfigWriter.sortKeys(config);
    const json = JSON.stringify(ordered, null, 2);
    fs.writeFileSync(filePath, json + "\n", "utf-8");
  }

  private static sortKeys(config: ILintConfigExtended): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key of CANONICAL_KEY_ORDER) {
      const value = config[key];
      if (value === undefined) continue;
      result[key] = value;
    }

    return result;
  }
}
