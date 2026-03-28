import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import { Check } from "../check.base";
import { TypeGuard } from "@tyforge/tools/type_guard";

export class CheckDeprecated extends Check {
  private readonly checkedPackages = new Set<string>();

  constructor() {
    super("deprecated packages", "blocking");
  }

  async run() {
    const details: string[] = [];

    const packageFiles = this.findPackageJsonFiles();
    const allDepsMap = this.collectAllDeps(packageFiles);
    const totalDeps = allDepsMap.size;

    if (totalDeps > 50) {
      process.stdout.write(`  ⚠️  ${totalDeps} unique dependencies found — deprecated check may take a while.\n`);
    }

    for (const [name, sources] of allDepsMap) {
      this.checkSingleDep(name, sources, details);
    }

    if (details.length > 0) return this.fail(details);
    return this.pass();
  }

  private collectAllDeps(packageFiles: string[]): Map<string, string[]> {
    const depsMap = new Map<string, string[]>();
    const depKeys = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];

    for (const pkgPath of packageFiles) {
      try {
        const content = fs.readFileSync(pkgPath, "utf-8");
        const parsed: unknown = JSON.parse(content);
        if (!TypeGuard.isRecord(parsed)) continue;

        for (const key of depKeys) {
          const section = parsed[key];
          if (TypeGuard.isRecord(section)) {
            for (const [name, version] of Object.entries(section)) {
              if (typeof version !== "string") continue;
              if (name.startsWith("file:") || name.startsWith("link:")) continue;
              const sources = depsMap.get(name);
              if (sources) {
                sources.push(pkgPath);
              } else {
                depsMap.set(name, [pkgPath]);
              }
            }
          }
        }
      } catch {
        // parse error, skip
      }
    }

    return depsMap;
  }

  private checkSingleDep(name: string, sources: string[], details: string[]): void {
    if (this.checkedPackages.has(name)) return;
    this.checkedPackages.add(name);

    try {
      const info = execFileSync("npm", ["view", name, "deprecated", "--json"], {
        stdio: "pipe",
        encoding: "utf-8",
        timeout: 10000,
      }).trim();
      if (info && info !== '""' && info !== "undefined" && info !== "") {
        const msg = info.replace(/^"|"$/g, "");
        for (const source of sources) {
          details.push(`❌ ${source}: ${name} is DEPRECATED — ${msg}`);
        }
      }
    } catch {
      // npm view failed — package might be private or not published, skip
    }
  }

}
