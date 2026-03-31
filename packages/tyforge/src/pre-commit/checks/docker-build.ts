import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { Check } from "../check.base";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");

export class CheckDockerBuild extends Check {
  constructor() {
    super("docs Docker build", "blocking");
  }

  async run() {
    if (!this.isDockerAvailable()) {
      return this.fail(["Docker not available — install Docker to run pre-commit checks"]);
    }
    try {
      execFileSync("docker", ["build", "-f", "docs/Dockerfile", "docs/", "--quiet"], { cwd: ROOT, stdio: "pipe", encoding: "utf-8", timeout: 300000 });
      return this.pass();
    } catch (e) {
      return this.fail(this.extractError(e, { stream: "stderr", limit: 5 }));
    }
  }
}
