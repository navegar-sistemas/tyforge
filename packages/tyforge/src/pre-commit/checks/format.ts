import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { Check } from "../check.base";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../..",
);

export class CheckFormat extends Check {
  constructor() {
    super("prettier", "blocking");
  }

  async run() {
    try {
      execSync("npx prettier --check 'packages/*/src/**/*.ts'", {
        cwd: ROOT,
        stdio: "pipe",
        encoding: "utf-8",
        timeout: 60000,
      });
      return this.pass();
    } catch (e) {
      return this.fail(
        this.extractError(e, {
          stream: "stdout",
          limit: 10,
        }),
      );
    }
  }
}
