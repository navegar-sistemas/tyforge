import { ToolDetect } from "../cli/detect.tool";
import { loadLintConfigExtended } from "../config/lint-config-loader";
import { RuleRegistry } from "../rule-registry";

function run(): void {
  if (ToolDetect.isCI()) return;

  const cwd = process.cwd();
  if (!ToolDetect.isGitRepo(cwd)) return;

  if (ToolDetect.hasExistingConfig(cwd)) {
    const config = loadLintConfigExtended();
    if (config?._meta) {
      const currentRuleCount = RuleRegistry.getDefaultRuleCount();
      if (currentRuleCount > config._meta.lastRulesCount) {
        console.log("tyforge: new linter rules available. Run `npx tyforge-lint --init --update` to review.");
      }
    }
    return;
  }

  console.log("tyforge: run `npx tyforge-lint --init` to configure pre-commit hooks.");
}

try { run(); } catch { /* Never fail npm install */ }
