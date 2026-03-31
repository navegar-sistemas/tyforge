import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { Check } from "../check.base";
import { TypeGuard } from "@tyforge/tools/type_guard";

export class CheckVersions extends Check {
  constructor() {
    super("version check", "confirmable");
  }

  async run() {
    const details: string[] = [];
    const packageFiles = this.findPackageJsonFiles();

    const pinnedDetails: string[] = [];
    this.checkPinnedVersions(pinnedDetails, packageFiles);
    if (pinnedDetails.length > 0) {
      details.push("📌 pinned versions");
      details.push(...pinnedDetails);
      details.push("");
    }

    const npmDetails: string[] = [];
    this.checkNpmOutdated(npmDetails, packageFiles);
    this.checkNpmAudit(npmDetails, packageFiles);
    if (npmDetails.length > 0) {
      details.push("📦 npm dependencies");
      details.push(...npmDetails);
      details.push("");
    }

    const engineDetails: string[] = [];
    this.checkNodeEngine(engineDetails);
    if (engineDetails.length > 0) {
      details.push("⚙️  runtime");
      details.push(...engineDetails);
      details.push("");
    }

    const dockerDetails: string[] = [];
    this.checkDockerImages(dockerDetails);
    if (dockerDetails.length > 0) {
      details.push("🐳 Docker images");
      details.push(...dockerDetails);
    }

    const cspDetails: string[] = [];
    this.checkDocusaurusInlineScripts(cspDetails);
    if (cspDetails.length > 0) {
      details.push("🔒 CSP workaround");
      details.push(...cspDetails);
      details.push("");
    }

    const hasWarnings = details.some((d) => d.includes("⚠️"));
    if (hasWarnings) return this.warn(details);
    if (details.length > 0) return this.pass(details);
    return this.pass();
  }

  private checkDocusaurusInlineScripts(details: string[]): void {
    const indexPath = "docs/build/index.html";
    try {
      const html = fs.readFileSync(indexPath, "utf-8");
      const inlineScripts = html.match(
        /<script(?:\s[^>]*)?>([^<]+)<\/script>/g,
      );
      const count = inlineScripts
        ? inlineScripts.filter((s) => !s.includes(" src=")).length
        : 0;
      if (count === 0) {
        details.push(
          "⚠️  Docusaurus no longer generates inline scripts — docs/generate-csp.js can be removed",
        );
        details.push(
          "    Replace CSP workaround with static policy (remove 'unsafe-inline' from style-src too)",
        );
      } else {
        details.push(
          `ℹ️  Docusaurus generates ${count} inline script(s) — CSP hash workaround (generate-csp.js) still required`,
        );
      }
    } catch {
      // build dir not available, skip
    }
  }

  private static readonly RANGE_REGEX = /^[\^~>=<*x|]|[\s-]\d/;

  private checkPinnedVersions(details: string[], packageFiles: string[]): void {
    const depKeys = ["dependencies", "devDependencies"];

    for (const pkg of packageFiles) {
      try {
        const content = fs.readFileSync(pkg, "utf-8");
        const parsed: unknown = JSON.parse(content);
        if (!TypeGuard.isRecord(parsed)) continue;

        const unpinned: string[][] = [];
        for (const key of depKeys) {
          const section = parsed[key];
          if (!TypeGuard.isRecord(section)) continue;
          for (const [name, version] of Object.entries(section)) {
            const versionCheck = TypeGuard.extractString(version, name);
            if (!versionCheck.success) continue;
            const v = versionCheck.value;
            if (
              v.startsWith("file:") ||
              v.startsWith("link:") ||
              v.startsWith("workspace:")
            )
              continue;
            if (CheckVersions.RANGE_REGEX.test(v)) {
              const suggested = v.replace(/^[\^~>=<]+/, "");
              unpinned.push([name, v, suggested]);
            }
          }
        }

        if (unpinned.length === 0) continue;

        details.push(`⚠️  ${pkg}: ${unpinned.length} unpinned:`);

        const maxName = Math.max(7, ...unpinned.map((r) => r[0].length));
        const maxCurrent = Math.max(7, ...unpinned.map((r) => r[1].length));
        const maxSuggested = Math.max(9, ...unpinned.map((r) => r[2].length));

        details.push(
          `    ${"Package".padEnd(maxName)}  ${"Current".padEnd(maxCurrent)}  ${"Suggested".padEnd(maxSuggested)}`,
        );
        details.push(
          `    ${"─".repeat(maxName)}  ${"─".repeat(maxCurrent)}  ${"─".repeat(maxSuggested)}`,
        );
        for (const [name, current, suggested] of unpinned) {
          details.push(
            `    ${name.padEnd(maxName)}  ${current.padEnd(maxCurrent)}  ${suggested.padEnd(maxSuggested)}`,
          );
        }
      } catch {
        // parse error, skip
      }
    }
  }

  private checkNpmOutdated(details: string[], packageFiles: string[]): void {
    for (const pkg of packageFiles) {
      const dir = path.dirname(pkg);
      if (!fs.existsSync(path.join(dir, "node_modules"))) continue;
      let jsonOutput = "";
      try {
        jsonOutput = execFileSync("npm", ["outdated", "--json"], {
          cwd: dir,
          stdio: "pipe",
          encoding: "utf-8",
          timeout: 30000,
        });
      } catch (e) {
        // npm outdated exits with code 1 when packages are outdated
        if (e instanceof Error && "stdout" in e) {
          const stdout = Object.getOwnPropertyDescriptor(e, "stdout")?.value;
          if (typeof stdout === "string") jsonOutput = stdout;
        }
      }
      if (!jsonOutput.trim() || jsonOutput.trim() === "{}") continue;
      try {
        const parsed: unknown = JSON.parse(jsonOutput);
        if (!TypeGuard.isRecord(parsed)) continue;
        const entries = Object.entries(parsed);
        if (entries.length === 0) continue;

        details.push(`⚠️  ${pkg}: ${entries.length} outdated:`);

        // Calculate column widths
        const rows: string[][] = [];
        for (const [name, info] of entries) {
          if (!TypeGuard.isRecord(info)) continue;
          const current = String(info["current"] ?? "?");
          const latest = String(info["latest"] ?? "?");
          rows.push([name, current, latest]);
        }

        const maxName = Math.max(7, ...rows.map((r) => r[0].length));
        const maxCurrent = Math.max(7, ...rows.map((r) => r[1].length));
        const maxLatest = Math.max(6, ...rows.map((r) => r[2].length));

        const header =
          `    ${"Package".padEnd(maxName)}` +
          `  ${"Current".padEnd(maxCurrent)}` +
          `  ${"Latest".padEnd(maxLatest)}`;
        const separator =
          `    ${"─".repeat(maxName)}` +
          `  ${"─".repeat(maxCurrent)}` +
          `  ${"─".repeat(maxLatest)}`;
        details.push(header);
        details.push(separator);
        for (const [name, current, latest] of rows) {
          details.push(
            `    ${name.padEnd(maxName)}  ${current.padEnd(maxCurrent)}  ${latest.padEnd(maxLatest)}`,
          );
        }
      } catch {
        details.push(
          `⚠️  ${pkg}: outdated dependencies (could not parse details)`,
        );
      }
    }
  }

  private checkNpmAudit(details: string[], packageFiles: string[]): void {
    for (const pkg of packageFiles) {
      const dir = path.dirname(pkg);
      if (!fs.existsSync(path.join(dir, "node_modules"))) continue;

      let auditJson = "";
      try {
        auditJson = execFileSync("npm", ["audit", "--json"], {
          cwd: dir,
          stdio: "pipe",
          encoding: "utf-8",
          timeout: 30000,
        });
      } catch (e) {
        if (e instanceof Error && "stdout" in e) {
          const stdout = Object.getOwnPropertyDescriptor(e, "stdout")?.value;
          if (typeof stdout === "string") auditJson = stdout;
        }
      }
      if (!auditJson.trim()) continue;

      try {
        const parsed: unknown = JSON.parse(auditJson);
        if (!TypeGuard.isRecord(parsed)) continue;

        // Extract vulnerability summary
        const metadata = parsed["metadata"];
        if (TypeGuard.isRecord(metadata)) {
          const vulnerabilities = metadata["vulnerabilities"];
          if (TypeGuard.isRecord(vulnerabilities)) {
            const high = Number(vulnerabilities["high"] ?? 0);
            const critical = Number(vulnerabilities["critical"] ?? 0);
            const moderate = Number(vulnerabilities["moderate"] ?? 0);
            const total = high + critical + moderate;
            if (total > 0) {
              const parts: string[] = [];
              if (critical > 0) parts.push(`${critical} critical`);
              if (high > 0) parts.push(`${high} high`);
              if (moderate > 0) parts.push(`${moderate} moderate`);
              details.push(
                `⚠️  ${pkg}: ${total} vulnerabilities (${parts.join(", ")})`,
              );
            }
          }
        }

        // Cross-reference: list vulnerable packages with fix versions
        const vulns = parsed["vulnerabilities"];
        if (TypeGuard.isRecord(vulns)) {
          const crossRef: string[] = [];
          for (const [name, info] of Object.entries(vulns)) {
            if (!TypeGuard.isRecord(info)) continue;
            const severity = String(info["severity"] ?? "");
            if (severity !== "high" && severity !== "critical") continue;
            const range = String(info["range"] ?? "");
            const fixAvailable = info["fixAvailable"];
            let fixInfo = "no fix available";
            if (fixAvailable === true) {
              fixInfo = "fix available via npm audit fix";
            } else if (TypeGuard.isRecord(fixAvailable)) {
              const fixVersion = String(fixAvailable["version"] ?? "");
              if (fixVersion) fixInfo = `fix: update to ${fixVersion}`;
            }
            crossRef.push(
              `    ${severity.toUpperCase().padEnd(8)}  ${name} (${range}) — ${fixInfo}`,
            );
          }
          if (crossRef.length > 0) {
            details.push(...crossRef);
          }
        }
      } catch {
        // parse error, skip
      }
    }
  }

  private checkNodeEngine(details: string[]): void {
    try {
      const parsed: unknown = JSON.parse(
        fs.readFileSync("package.json", "utf-8"),
      );
      if (!TypeGuard.isRecord(parsed)) return;
      const engines = parsed["engines"];
      if (!TypeGuard.isRecord(engines)) return;
      const nodeReqResult = TypeGuard.extractString(
        engines["node"],
        "engines.node",
      );
      if (!nodeReqResult.success) return;
      const nodeReq = nodeReqResult.value;
      const match = nodeReq.match(/>=(\d+)/);
      if (!match) return;
      const requiredMajor = Number(match[1]);
      const currentVersion = process.version.replace("v", "");
      const currentMajor = Number(currentVersion.split(".")[0]);
      if (currentMajor < requiredMajor) {
        details.push(
          `⚠️  Node.js: running v${currentVersion}, requires >=${requiredMajor}`,
        );
      }
    } catch {
      // ignore parse errors
    }
  }

  private checkDockerImages(details: string[]): void {
    if (!this.isDockerAvailable()) return;

    const dockerfiles = this.findDockerfiles();
    for (const filepath of dockerfiles) {
      const content = fs.readFileSync(filepath, "utf-8");
      const fromLines = content
        .split("\n")
        .filter((l) => l.trim().startsWith("FROM "));

      for (const line of fromLines) {
        const image = line
          .trim()
          .replace(/^FROM\s+/, "")
          .split(/\s/)[0];
        if (!image || image.startsWith("$") || image === "scratch") continue;

        const colonIdx = image.indexOf(":");
        if (colonIdx === -1) continue;
        const base = image.substring(0, colonIdx);
        const tag = image.substring(colonIdx + 1);
        if (!/^\d/.test(tag)) continue;

        this.checkImageVersion(filepath, base, tag, details);
      }
    }
  }

  private checkImageVersion(
    filepath: string,
    base: string,
    tag: string,
    details: string[],
  ): void {
    const image = `${base}:${tag}`;
    const variantMatch = tag.match(/-([a-z].*)$/);
    const variant = variantMatch ? variantMatch[1] : "";
    const pinned = tag.replace(/-[a-z].*/, "");
    const parts = pinned.split(".");
    const major = parts[0];
    const minor = parts.length > 1 ? parts[1] : "";
    if (!/^\d+$/.test(major)) {
      details.push(`ℹ️  ${filepath}: ${image} — could not parse version`);
      return;
    }

    // If version has minor (e.g., 1.28.3), compare within minor (1.28.x)
    // If only major (e.g., 24), compare within major (24.x)
    const prefix = minor ? `${major}.${minor}` : major;
    const latestVersion = this.fetchLatestVersion(base, prefix, variant);
    if (!latestVersion) {
      details.push(
        `ℹ️  ${filepath}: ${image} — could not fetch latest version`,
      );
      return;
    }

    if (latestVersion !== pinned) {
      details.push(
        `⚠️  ${filepath}: ${image} pinned → latest ${prefix}.x is ${latestVersion}`,
      );
    } else {
      details.push(`✅ ${filepath}: ${image} is up to date`);
    }
  }

  private fetchLatestVersion(
    base: string,
    prefix: string,
    variant: string,
  ): string {
    // Query Docker Hub registry API for tags
    // matching prefix.x.x-variant or prefix.x-variant
    const repo = base.includes("/") ? base : `library/${base}`;
    const variantSuffix = variant ? `-${variant}` : "";
    const escapedSuffix = variantSuffix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // prefix can be "24" (major only) or "1.28" (major.minor)
    const dots = prefix.split(".").length;
    const versionPattern =
      dots >= 2
        ? new RegExp(`^${prefix.replace(/\./g, "\\.")}\\.\\d+${escapedSuffix}$`)
        : new RegExp(`^${prefix}\\.\\d+\\.\\d+${escapedSuffix}$`);

    try {
      // Docker Hub API: list tags sorted by last_updated
      const url =
        `https://hub.docker.com/v2/repositories/` +
        `${repo}/tags?page_size=100&ordering=last_updated`;
      const output = execFileSync("curl", ["-s", "--max-time", "15", url], {
        stdio: "pipe",
        encoding: "utf-8",
        timeout: 20000,
      });

      const parsed: unknown = JSON.parse(output);
      if (!TypeGuard.isRecord(parsed)) return "";
      const results = parsed["results"];
      if (!Array.isArray(results)) return "";

      // Find all tags matching major.x.x-variant pattern, pick highest semver
      let best = "";
      let bestParts = [0, 0, 0];
      for (const entry of results) {
        if (!TypeGuard.isRecord(entry)) continue;
        const name = entry["name"];
        const tagResult = TypeGuard.extractString(name, "name");
        if (!tagResult.success) continue;
        const tagName = tagResult.value;
        if (!versionPattern.test(tagName)) continue;

        const versionOnly = tagName.replace(variantSuffix, "");
        const parts = versionOnly.split(".").map(Number);
        if (parts.length < 3 || parts.some(isNaN)) continue;

        if (
          parts[0] > bestParts[0] ||
          (parts[0] === bestParts[0] && parts[1] > bestParts[1]) ||
          (parts[0] === bestParts[0] &&
            parts[1] === bestParts[1] &&
            parts[2] > bestParts[2])
        ) {
          best = versionOnly;
          bestParts = parts;
        }
      }

      return best;
    } catch {
      return "";
    }
  }
}
