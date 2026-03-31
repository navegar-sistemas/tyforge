import * as fs from "node:fs";
import * as path from "node:path";
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
    if (filePath.includes("\0")) {
      throw new Error("Invalid config path: contains null bytes");
    }
    const resolved = path.resolve(filePath);
    if (resolved.includes("..")) {
      throw new Error("Invalid config path: contains path traversal");
    }
    if (!resolved.startsWith(process.cwd())) {
      throw new Error("Invalid config path: outside working directory");
    }
    const ordered = ConfigWriter.sortKeys(config);
    const content = JSON.stringify(ordered, null, 2) + "\n";
    fs.writeFileSync(resolved, content, "utf-8");
  }

  private static sortKeys(
    config: ILintConfigExtended,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key of CANONICAL_KEY_ORDER) {
      const value = config[key];
      if (value === undefined) continue;
      result[key] = value;
    }

    return result;
  }
}
