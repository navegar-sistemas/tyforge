import { execFileSync } from "node:child_process";
import { Check } from "../check.base";

export class CheckTests extends Check {
  constructor() {
    super("tests", "blocking");
  }

  async run() {
    try {
      const output = execFileSync("npm", ["run", "test"], { stdio: "pipe", encoding: "utf-8", timeout: 120000 });
      const summary = output.split("\n").filter(l => l.startsWith("ℹ")).join("\n");
      return this.pass(summary ? [summary] : []);
    } catch (e) {
      return this.fail(this.extractError(e, {
        stream: "both",
        filter: l => l.includes("✗") || l.includes("fail") || l.includes("FAIL") || l.includes("Error"),
      }));
    }
  }
}
