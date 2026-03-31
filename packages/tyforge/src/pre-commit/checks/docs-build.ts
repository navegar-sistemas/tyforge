import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { Check } from "../check.base";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../..",
);

export class CheckDocsBuild extends Check {
  constructor() {
    super("docs build", "blocking");
  }

  async run() {
    try {
      execFileSync("npm", ["run", "build"], {
        cwd: path.join(ROOT, "docs"),
        stdio: "pipe",
        encoding: "utf-8",
        timeout: 120000,
      });
      return this.pass();
    } catch (e) {
      return this.fail(
        this.extractError(e, {
          stream: "both",
          filter: (l) => l.includes("Error") || l.includes("error"),
          limit: 10,
        }),
      );
    }
  }
}
