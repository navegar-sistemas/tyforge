import type { ICheckResult } from "../check.base";

export class TerminalReporter {
  private checkIndex = 0;
  private totalChecks = 0;

  setTotal(total: number): void {
    this.totalChecks = total;
  }

  start(name: string): void {
    this.checkIndex++;
    process.stdout.write(
      `[${this.checkIndex}/${this.totalChecks}] ${name}...\n`,
    );
  }

  result(result: ICheckResult): void {
    switch (result.status) {
      case "pass":
        break;
      case "warn":
        for (const line of result.details) {
          process.stdout.write(`  ${line}\n`);
        }
        break;
      case "fail":
        process.stderr.write(`  ❌ ${result.name} failed:\n`);
        for (const line of result.details) {
          process.stderr.write(`    ${line}\n`);
        }
        break;
    }
  }

  versionWarnings(result: ICheckResult): void {
    if (result.details.length === 0) return;
    process.stdout.write("\n  ════════════════════════════════════════\n");
    process.stdout.write("  Version check results\n");
    process.stdout.write("  ════════════════════════════════════════\n\n");
    for (const line of result.details) {
      process.stdout.write(`  ${line}\n`);
    }
    process.stdout.write("\n  ════════════════════════════════════════\n\n");
  }

  async promptConfirmationAsync(): Promise<boolean> {
    if (!process.stdin.isTTY) {
      process.stdout.write(
        "  ❌ Non-interactive terminal — cannot confirm. Commit blocked.\n",
      );
      return false;
    }
    const readline = await import("node:readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    return new Promise<boolean>((resolve) => {
      rl.question("  Commit with these warnings? [y/N] ", (answer: string) => {
        rl.close();
        resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
      });
    });
  }

  success(): void {
    process.stdout.write("✅ All pre-commit checks passed.\n");
  }

  aborted(): void {
    process.stdout.write("  Commit aborted.\n");
  }
}
