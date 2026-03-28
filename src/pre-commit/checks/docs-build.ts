import { execFileSync } from "node:child_process";
import { Check } from "../check.base";

export class CheckDocsBuild extends Check {
  constructor() {
    super("docs build", "blocking");
  }

  async run() {
    try {
      execFileSync("npm", ["run", "build"], { cwd: "docs", stdio: "pipe", encoding: "utf-8", timeout: 120000 });
      return this.pass();
    } catch (e) {
      return this.fail(this.extractError(e, {
        stream: "both",
        filter: l => l.includes("Error") || l.includes("error"),
        limit: 10,
      }));
    }
  }
}
