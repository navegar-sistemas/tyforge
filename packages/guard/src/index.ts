#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { ToolCliParser } from "tyforge/tools";
import { ToolFileDiscovery } from "./cli/file-discovery.tool";
import { ToolGit } from "./cli/git.tool";
import { Linter } from "./linter";
import { RuleRegistry } from "./rule-registry";
import { DisableCommentParser } from "./disable-comment-parser";
import { TextReporter } from "./text-reporter";
import { JsonReporter } from "./json-reporter";
import type { IReporter } from "./reporter";
import { loadLintConfig } from "./config";
import { NoInvalidFactorySignatureRule } from "./rules/dsl/no-invalid-factory-signature.rule";
import { NoPublicConstructorDomainRule } from "./rules/dsl/no-public-constructor-domain.rule";

const cli = new ToolCliParser(process.argv.slice(2));

const cwdArg = cli.getFlagValue("--cwd");
if (cwdArg) {
  const resolved = path.resolve(cwdArg);
  if (!fs.existsSync(resolved)) {
    console.error(`tyforge-guard: --cwd path does not exist: ${resolved}`);
    process.exit(1);
  }
  process.chdir(resolved);
}

if (cli.hasFlag("--init")) {
  if (cli.hasFlag("--update")) {
    const { UpdateCommand } = await import("./cli/update-command");
    new UpdateCommand()
      .execute()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    const { InitCommand } = await import("./cli/init-command");
    new InitCommand()
      .execute()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
} else if (cli.hasFlag("--uninstall")) {
  const { UninstallCommand } = await import("./cli/uninstall-command");
  new UninstallCommand()
    .execute()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  const config = loadLintConfig(cli.getFlagValue("--config"));

  const registry = new RuleRegistry();
  registry.registerAll(RuleRegistry.createDefault());
  registry.applyConfig(config.rules);

  const discovery = new ToolFileDiscovery(config.root, config.exclude);
  const positionalPaths = cli.getPositionalArgs();

  let files: string[];
  if (positionalPaths.length > 0) {
    files = discovery.findByPaths(positionalPaths, ".ts");
  } else if (cli.hasFlag("--staged")) {
    files = ToolGit.getStagedFiles(".ts");
  } else {
    files = discovery.findByExtension(".ts");
  }

  if (files.length === 0) {
    console.log("tyforge-guard: no .ts files to check");
    process.exit(0);
  }

  const linter = new Linter(registry, new DisableCommentParser());
  linter.registerAstRules([
    new NoInvalidFactorySignatureRule(),
    new NoPublicConstructorDomainRule(),
  ]);
  const violations = linter.checkFiles(files, cli.hasFlag("--fix"));

  const format = cli.getFlagValue("--format") === "json" ? "json" : "text";
  const reporter: IReporter =
    format === "json" ? new JsonReporter() : new TextReporter();
  reporter.report(violations);

  const hasErrors = config.strict
    ? violations.some((v) => v.severity === "error" || v.severity === "warning")
    : violations.some((v) => v.severity === "error");

  process.exit(hasErrors ? 1 : 0);
}
