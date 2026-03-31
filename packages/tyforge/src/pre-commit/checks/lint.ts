import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { Check } from "../check.base";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const GUARD_BIN = path.join(ROOT, "packages", "guard", "dist", "index.js");

export class CheckLint extends Check {
  constructor() {
    super("tyforge-guard", "blocking");
  }

  async run() {
    if (!fs.existsSync(GUARD_BIN)) {
      return this.fail(["Guard binary not found — run npm run build first"]);
    }
    try {
      execFileSync("node", [GUARD_BIN], { cwd: ROOT, stdio: "pipe", encoding: "utf-8", timeout: 60000 });
      return this.pass();
    } catch (e) {
      return this.fail(this.extractError(e, { stream: "stdout" }));
    }
  }
}
