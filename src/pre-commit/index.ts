import { Check } from "./check.base";
import { CheckTypecheck } from "./checks/typecheck";
import { CheckTests } from "./checks/tests";
import { CheckLint } from "./checks/lint";
import { CheckDocsBuild } from "./checks/docs-build";
import { CheckDockerBuild } from "./checks/docker-build";
import { CheckDeprecated } from "./checks/deprecated-check";
import { CheckVersions } from "./checks/version-check";
import { TerminalReporter } from "./reporters/terminal";

async function main(): Promise<void> {
  process.stdout.write("Running pre-commit checks...\n");

  const reporter = new TerminalReporter();

  const blockingChecks: Check[] = [
    new CheckTypecheck(),
    new CheckTests(),
    new CheckLint(),
    new CheckDocsBuild(),
    new CheckDockerBuild(),
    new CheckDeprecated(),
  ];

  const confirmableChecks: Check[] = [
    new CheckVersions(),
  ];

  const allChecks = [...blockingChecks, ...confirmableChecks];
  reporter.setTotal(allChecks.length);

  // Run blocking checks — any failure aborts immediately
  for (const check of blockingChecks) {
    reporter.start(check.name);
    const result = await check.run();
    reporter.result(result);
    if (result.status === "fail") {
      process.exit(1);
    }
  }

  // Run confirmable checks — warnings require user confirmation
  for (const check of confirmableChecks) {
    reporter.start(check.name);
    const result = await check.run();

    if (result.status === "warn") {
      reporter.versionWarnings(result);
      const confirmed = await reporter.promptConfirmationAsync();
      if (!confirmed) {
        reporter.aborted();
        process.exit(1);
      }
    } else if (result.status === "pass" && result.details.length > 0) {
      reporter.versionWarnings(result);
    }
  }

  reporter.success();
}

main().catch((err) => {
  process.stderr.write(`Pre-commit error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
