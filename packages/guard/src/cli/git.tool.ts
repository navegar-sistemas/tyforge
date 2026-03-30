import { execSync } from "node:child_process";

export class ToolGit {
  static getStagedFiles(extension?: string): string[] {
    try {
      const output = execSync("git diff --cached --name-only --diff-filter=ACM", {
        encoding: "utf-8",
      }).trim();
      if (!output) return [];
      const files = output.split("\n").map(f => f.trim()).filter(Boolean);
      if (extension) {
        return files.filter(f => f.endsWith(extension));
      }
      return files;
    } catch {
      return [];
    }
  }
}
