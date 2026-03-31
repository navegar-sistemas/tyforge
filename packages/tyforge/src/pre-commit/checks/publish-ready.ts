import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import { Check } from "../check.base";
import { TypeGuard } from "@tyforge/tools/type_guard";

export class CheckPublishReady extends Check {
  constructor() {
    super("publish ready", "blocking");
  }

  async run() {
    const details: string[] = [];
    const packageFiles = this.findPackageJsonFiles();

    const packages: { name: string; version: string; isPrivate: boolean; tyforgeVersions: string[] }[] = [];

    for (const pkg of packageFiles) {
      try {
        const content = fs.readFileSync(pkg, "utf-8");
        const parsed: unknown = JSON.parse(content);
        if (!TypeGuard.isRecord(parsed)) continue;

        const nameResult = TypeGuard.extractString(parsed["name"], "name");
        const versionResult = TypeGuard.extractString(parsed["version"], "version");
        if (!nameResult.success || !versionResult.success) continue;

        const isPrivate = parsed["private"] === true;
        const tyforgeVersions: string[] = [];

        for (const depKey of ["peerDependencies", "devDependencies"]) {
          const deps = parsed[depKey];
          if (!TypeGuard.isRecord(deps)) continue;
          const tf = deps["tyforge"];
          const tfResult = TypeGuard.extractString(tf, "tyforge");
          if (tfResult.success && !tyforgeVersions.includes(tfResult.value)) {
            tyforgeVersions.push(tfResult.value);
          }
        }

        packages.push({ name: nameResult.value, version: versionResult.value, isPrivate, tyforgeVersions });
      } catch {
        continue;
      }
    }

    for (const pkg of packages) {
      if (pkg.isPrivate) continue;
      try {
        const npmVersion = execFileSync("npm", ["view", pkg.name, "version"], {
          encoding: "utf-8", timeout: 15000, stdio: "pipe",
        }).trim();
        if (npmVersion === pkg.version) {
          details.push(`${pkg.name}@${pkg.version} already published — increment version`);
        }
      } catch (e) {
        // npm view returns exit code 1 for unpublished packages (E404)
        // Network/auth errors should not be silently ignored
        if (e && typeof e === "object" && "stderr" in e) {
          const stderr = String((e as Record<string, unknown>)["stderr"] ?? "");
          if (!stderr.includes("E404") && !stderr.includes("is not in this registry")) {
            details.push(`${pkg.name}: npm registry unreachable — cannot verify version`);
          }
        }
      }
    }

    const core = packages.find((p) => p.name === "tyforge");
    if (core) {
      for (const pkg of packages) {
        if (pkg.name === "tyforge" || pkg.isPrivate) continue;
        for (const depVersion of pkg.tyforgeVersions) {
          if (depVersion !== core.version) {
            details.push(`${pkg.name} depends on tyforge@${depVersion} but core is ${core.version}`);
          }
        }
      }
    }

    if (details.length > 0) return this.fail(details);
    return this.pass();
  }
}
