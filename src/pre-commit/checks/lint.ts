import { execFileSync } from "node:child_process";
import { Check } from "../check.base";

export class CheckLint extends Check {
  constructor() {
    super("tyforge-lint", "blocking");
  }

  async run() {
    try {
      execFileSync("npx", ["tsx", "src/lint/index.ts", "--all"], { stdio: "pipe", encoding: "utf-8", timeout: 60000 });
      return this.pass();
    } catch (e) {
      return this.fail(this.extractError(e, { stream: "stdout" }));
    }
  }
}
