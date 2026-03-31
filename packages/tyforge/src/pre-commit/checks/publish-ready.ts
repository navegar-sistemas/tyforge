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
const RANGE_REGEX = /^[\^~>=<*x|]/;

function isInternalDep(name: string): boolean {
  return name === "tyforge" || name.startsWith("@tyforge/");
}

function parseSemver(version: string): [number, number, number] | null {
  const parts = version.split(".");
  if (parts.length !== 3) return null;
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
  return [nums[0], nums[1], nums[2]];
}

// Validates that local is exactly one semver increment from published.
// Valid: 1.2.3→1.2.4, 1.2.34→1.3.0, 1.2.34→2.0.0
// Invalid: 1.2.3→1.2.5 (skipped patch), 1.2.3→1.4.0 (skipped minor)
function isValidIncrement(published: string, local: string): boolean {
  const pub = parseSemver(published);
  const loc = parseSemver(local);
  if (!pub || !loc) return true;

  const [pMaj, pMin, pPat] = pub;
  const [lMaj, lMin, lPat] = loc;

  // major bump: major+1, minor=0, patch=0
  if (lMaj === pMaj + 1 && lMin === 0 && lPat === 0) return true;
  // minor bump: same major, minor+1, patch=0
  if (lMaj === pMaj && lMin === pMin + 1 && lPat === 0) return true;
  // patch bump: same major+minor, patch+1
  if (lMaj === pMaj && lMin === pMin && lPat === pPat + 1) return true;

  return false;
}

interface IInternalDep {
  readonly name: string;
  readonly version: string;
}

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
      internalDeps: IInternalDep[];
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
        const internalDeps: IInternalDep[] = [];

        for (const depKey of [
          "dependencies",
          "peerDependencies",
          "devDependencies",
        ]) {
          const deps = parsed[depKey];
          if (!TypeGuard.isRecord(deps)) continue;
          for (const [depName, depVersion] of Object.entries(deps)) {
            if (!isInternalDep(depName)) continue;
            const vResult = TypeGuard.extractString(depVersion, depName);
            if (!vResult.success) continue;
            const alreadyTracked = internalDeps.some(
              (d) => d.name === depName && d.version === vResult.value,
            );
            if (!alreadyTracked) {
              internalDeps.push({
                name: depName,
                version: vResult.value,
              });
            }
          }
        }

        packages.push({
          name: nameResult.value,
          version: versionResult.value,
          isPrivate,
          internalDeps,
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
        } else if (!isValidIncrement(npmVersion, pkg.version)) {
          details.push(
            `${pkg.name} skipped version: npm has ${npmVersion}, local is ${pkg.version} — must increment by exactly 1`,
          );
        }
      } catch (e) {
        const stderr = this.extractError(e, {
          stream: "stderr",
        }).join("\n");
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

    const internalVersions = new Map<string, string>();
    for (const pkg of packages) {
      if (!pkg.isPrivate) internalVersions.set(pkg.name, pkg.version);
    }

    for (const pkg of packages) {
      if (pkg.isPrivate) continue;
      for (const dep of pkg.internalDeps) {
        const expectedVersion = internalVersions.get(dep.name);
        if (!expectedVersion) continue;
        if (dep.version !== expectedVersion) {
          details.push(
            `${pkg.name} depends on ${dep.name}@${dep.version} but local is ${expectedVersion}`,
          );
        }
        if (RANGE_REGEX.test(dep.version)) {
          details.push(
            `${pkg.name} has unpinned internal dep ${dep.name}@${dep.version} — must be exact version`,
          );
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
