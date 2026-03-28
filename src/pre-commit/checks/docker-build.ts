import { execFileSync } from "node:child_process";
import { Check } from "../check.base";

export class CheckDockerBuild extends Check {
  constructor() {
    super("docs Docker build", "blocking");
  }

  async run() {
    if (!this.isDockerAvailable()) {
      return this.warn(["Docker not available — skipping Docker build check"]);
    }
    try {
      execFileSync("docker", ["build", "-f", "docs/Dockerfile", "docs/", "--quiet"], { stdio: "pipe", encoding: "utf-8", timeout: 300000 });
      return this.pass();
    } catch (e) {
      return this.fail(this.extractError(e, { stream: "stderr", limit: 5 }));
    }
  }
}
