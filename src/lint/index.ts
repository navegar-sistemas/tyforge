#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { ToolCliParser } from "@tyforge/tools/cli-parser.tool";
import { ToolFileDiscovery } from "@tyforge/tools/file-discovery.tool";
import { ToolGit } from "@tyforge/tools/git.tool";
import { Linter } from "./linter";
import { RuleRegistry } from "./rule-registry";
import { DisableCommentParser } from "./disable-comment-parser";
import { TextReporter } from "./text-reporter";
import { JsonReporter } from "./json-reporter";
import type { IReporter } from "./reporter";
import { loadLintConfig } from "./config";
import { NoAnyRule } from "./rules/no-any.rule";
import { NoCastRule } from "./rules/no-cast.rule";
import { NoNonNullRule } from "./rules/no-non-null.rule";
import { NoTsIgnoreRule } from "./rules/no-ts-ignore.rule";
import { NoExportDefaultRule } from "./rules/no-export-default.rule";
import { NoToJsonLowercaseRule } from "./rules/no-to-json-lowercase.rule";
import { NoNewTypeFieldRule } from "./rules/no-new-type-field.rule";
import { NoMagicHttpStatusRule } from "./rules/no-magic-http-status.rule";
import { NoDeclareRule } from "./rules/no-declare.rule";
import { NoSatisfiesWithoutPrefixRule } from "./rules/no-satisfies-without-prefix.rule";

const cli = new ToolCliParser(process.argv.slice(2));

const cwdArg = cli.getFlagValue("--cwd");
if (cwdArg) {
  const resolved = path.resolve(cwdArg);
  if (!fs.existsSync(resolved)) {
    console.error(`tyforge-lint: --cwd path does not exist: ${resolved}`);
    process.exit(1);
  }
  process.chdir(resolved);
}

if (cli.hasFlag("--init")) {
  const mod = cli.hasFlag("--update")
    ? require("./cli/update-command")
    : require("./cli/init-command");
  const Command = cli.hasFlag("--update") ? mod.UpdateCommand : mod.InitCommand;
  new Command().execute().then(() => process.exit(0)).catch(() => process.exit(1));
} else if (cli.hasFlag("--uninstall")) {
  const { UninstallCommand } = require("./cli/uninstall-command");
  new UninstallCommand().execute().then(() => process.exit(0)).catch(() => process.exit(1));
} else {
  const config = loadLintConfig(cli.getFlagValue("--config"));

  const registry = new RuleRegistry();
  registry.registerAll([
    new NoAnyRule(),
    new NoCastRule(),
    new NoNonNullRule(),
    new NoTsIgnoreRule(),
    new NoExportDefaultRule(),
    new NoToJsonLowercaseRule(),
    new NoNewTypeFieldRule(),
    new NoMagicHttpStatusRule("warning"),
    new NoDeclareRule(),
    new NoSatisfiesWithoutPrefixRule(),
  ]);
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
    console.log("tyforge-lint: no .ts files to check");
    process.exit(0);
  }

  const linter = new Linter(registry, new DisableCommentParser());
  const violations = linter.checkFiles(files, cli.hasFlag("--fix"));

  const format = cli.getFlagValue("--format") === "json" ? "json" : "text";
  const reporter: IReporter = format === "json" ? new JsonReporter() : new TextReporter();
  reporter.report(violations);

  const hasErrors = config.strict
    ? violations.some(v => v.severity === "error" || v.severity === "warning")
    : violations.some(v => v.severity === "error");

  process.exit(hasErrors ? 1 : 0);
}
