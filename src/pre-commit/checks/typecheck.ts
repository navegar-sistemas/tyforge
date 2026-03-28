import { execFileSync } from "node:child_process";
import { Check } from "../check.base";

export class CheckTypecheck extends Check {
  constructor() {
    super("typecheck", "blocking");
  }

  async run() {
    try {
      execFileSync("npm", ["run", "typecheck"], { stdio: "pipe", encoding: "utf-8", timeout: 120000 });
      return this.pass();
    } catch (e) {
      return this.fail(this.extractError(e, { stream: "stdout" }));
    }
  }
}
