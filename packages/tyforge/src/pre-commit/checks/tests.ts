import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { Check } from "../check.base";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../..",
);

export class CheckTests extends Check {
  constructor() {
    super("tests", "blocking");
  }

  async run() {
    const result = spawnSync("npm", ["run", "test"], {
      cwd: ROOT,
      encoding: "utf-8",
      timeout: 180000,
      env: { ...process.env, NODE_OPTIONS: "" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (result.status === 0) {
      return this.pass([]);
    }

    const lines = (result.stdout ?? "")
      .split("\n")
      .filter(
        (l) => l.includes("✖") || l.includes("FAIL") || l.startsWith("ℹ fail"),
      );
    return this.fail(
      lines.length > 0 ? lines : [`exit code: ${result.status}`],
    );
  }
}
