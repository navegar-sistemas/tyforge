import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { Check } from "../check.base";
import { TypeGuard } from "@tyforge/tools/type_guard";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../..",
);

export class CheckPublishReady extends Check {
  constructor() {
    super("publish ready", "blocking");
  }

  async run() {
    const details: string[] = [];
    const packageFiles = this.findAllWorkspacePackageJsons();

    const packages: {
      name: string;
      version: string;
      isPrivate: boolean;
      tyforgeVersions: string[];
    }[] = [];

    for (const pkg of packageFiles) {
      try {
        const content = fs.readFileSync(pkg, "utf-8");
        const parsed: unknown = JSON.parse(content);
        if (!TypeGuard.isRecord(parsed)) continue;

        const nameResult = TypeGuard.extractString(parsed["name"], "name");
        const versionResult = TypeGuard.extractString(
          parsed["version"],
          "version",
        );
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

        packages.push({
          name: nameResult.value,
          version: versionResult.value,
          isPrivate,
          tyforgeVersions,
        });
      } catch {
        continue;
      }
    }

    for (const pkg of packages) {
      if (pkg.isPrivate) continue;
      try {
        const npmVersion = execFileSync("npm", ["view", pkg.name, "version"], {
          encoding: "utf-8",
          timeout: 15000,
          stdio: "pipe",
        }).trim();
        if (npmVersion === pkg.version) {
          details.push(
            `${pkg.name}@${pkg.version} already published — increment version`,
          );
        }
      } catch (e) {
        if (e && typeof e === "object" && "stderr" in e) {
          const stderr = String(e.stderr ?? "");
          if (
            !stderr.includes("E404") &&
            !stderr.includes("is not in this registry")
          ) {
            details.push(
              `${pkg.name}: npm registry unreachable — cannot verify version`,
            );
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
            details.push(
              `${pkg.name} depends on tyforge@${depVersion} but core is ${core.version}`,
            );
          }
        }
      }
    }

    if (details.length > 0) return this.fail(details);
    return this.pass();
  }

  private findAllWorkspacePackageJsons(): string[] {
    const packagesDir = path.join(ROOT, "packages");
    const results: string[] = [];
    try {
      const entries = fs.readdirSync(packagesDir);
      for (const entry of entries) {
        const pkgPath = path.join(packagesDir, entry, "package.json");
        if (fs.existsSync(pkgPath)) {
          results.push(pkgPath);
        }
      }
    } catch {
      // fallback to cwd if packages dir not found
    }
    return results;
  }
}
