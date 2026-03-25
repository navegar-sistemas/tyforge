import { ToolDetect } from "../cli/detect.tool";
import { loadLintConfigExtended } from "../config/lint-config-loader";

import { NoAnyRule } from "../rules/no-any.rule";
import { NoCastRule } from "../rules/no-cast.rule";
import { NoNonNullRule } from "../rules/no-non-null.rule";
import { NoTsIgnoreRule } from "../rules/no-ts-ignore.rule";
import { NoExportDefaultRule } from "../rules/no-export-default.rule";
import { NoToJsonLowercaseRule } from "../rules/no-to-json-lowercase.rule";
import { NoNewTypeFieldRule } from "../rules/no-new-type-field.rule";
import { NoMagicHttpStatusRule } from "../rules/no-magic-http-status.rule";
import { NoDeclareRule } from "../rules/no-declare.rule";
import { NoSatisfiesWithoutPrefixRule } from "../rules/no-satisfies-without-prefix.rule";

function getCurrentRuleCount(): number {
  const rules = [
    new NoAnyRule(),
    new NoCastRule(),
    new NoNonNullRule(),
    new NoTsIgnoreRule(),
    new NoExportDefaultRule(),
    new NoToJsonLowercaseRule(),
    new NoNewTypeFieldRule(),
    new NoMagicHttpStatusRule(),
    new NoDeclareRule(),
    new NoSatisfiesWithoutPrefixRule(),
  ];
  return rules.length;
}

function run(): void {
  if (ToolDetect.isCI()) return;

  const cwd = process.cwd();
  if (!ToolDetect.isGitRepo(cwd)) return;

  if (ToolDetect.hasExistingConfig(cwd)) {
    const config = loadLintConfigExtended();
    if (config?._meta) {
      const currentRuleCount = getCurrentRuleCount();
      if (currentRuleCount > config._meta.lastRulesCount) {
        console.log("tyforge: new linter rules available. Run `npx tyforge-lint --init --update` to review.");
      }
    }
    return;
  }

  console.log("tyforge: run `npx tyforge-lint --init` to configure pre-commit hooks.");
}

try { run(); } catch { /* Never fail npm install */ }
