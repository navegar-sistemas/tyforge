import { ToolDetect } from "../cli/detect.tool";
import { loadLintConfigExtended } from "../config/lint-config-loader";
import { RuleRegistry } from "../rule-registry";

async function run(): Promise<void> {
  if (ToolDetect.isCI()) return;

  const cwd = process.cwd();
  if (!ToolDetect.isGitRepo(cwd)) return;

  if (ToolDetect.hasExistingConfig(cwd)) {
    const config = loadLintConfigExtended();
    if (config?._meta) {
      const currentRuleCount = RuleRegistry.getDefaultRuleCount();
      if (currentRuleCount > config._meta.lastRulesCount) {
        console.log(
          "tyforge: new linter rules available. Run `npx tyforge-guard --init --update` to review.",
        );
      }
    }
    return;
  }

  console.log(
    "tyforge: run `npx tyforge-guard --init` to configure pre-commit hooks.",
  );
}

try {
  run().catch(() => {});
} catch {
  /* Never fail npm install */
}
