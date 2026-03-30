import * as fs from "node:fs";
import * as path from "node:path";

export class ToolFileDiscovery {
  constructor(
    private readonly rootDir: string,
    private readonly excludePatterns: string[] = [],
  ) {}

  findByExtension(extension: string): string[] {
    const files = this.walkDirectory(this.rootDir);
    const filtered = files.filter(f => f.endsWith(extension));
    return this.applyExcludes(filtered);
  }

  findByPaths(paths: string[], extension: string): string[] {
    const basePath = path.resolve(this.rootDir) + path.sep;
    const results: string[] = [];
    for (const p of paths) {
      const resolved = path.resolve(p);
      if (!resolved.startsWith(basePath) && resolved !== path.resolve(this.rootDir)) continue;
      if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
        const sub = new ToolFileDiscovery(resolved, this.excludePatterns);
        results.push(...sub.findByExtension(extension));
      } else if (resolved.endsWith(extension)) {
        results.push(resolved);
      }
    }
    return this.applyExcludes(results);
  }

  private walkDirectory(dir: string): string[] {
    const results: string[] = [];
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return results;
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        results.push(...this.walkDirectory(fullPath));
      } else {
        results.push(fullPath);
      }
    }
    return results;
  }

  private applyExcludes(files: string[]): string[] {
    if (this.excludePatterns.length === 0) return files;
    return files.filter(f => !this.excludePatterns.some(pattern => this.matchGlob(f, pattern)));
  }

  private matchGlob(filePath: string, pattern: string): boolean {
    const regexStr = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, "{{GLOBSTAR}}")
      .replace(/\*/g, "[^/]*")
      .replace(/\{\{GLOBSTAR\}\}/g, ".*")
      .replace(/\?/g, "[^/]");
    return new RegExp("^" + regexStr + "$").test(filePath);
  }
}
