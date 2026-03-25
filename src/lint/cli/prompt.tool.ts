import * as readline from "node:readline/promises";
import type { IPromptIO } from "./prompt-io.interface";

interface ISelectOption<T> {
  readonly label: string;
  readonly value: T;
  readonly recommended?: boolean;
}

export class ReadlinePromptIO implements IPromptIO {
  private readonly rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async question(prompt: string): Promise<string> {
    return this.rl.question(prompt);
  }

  write(text: string): void {
    process.stdout.write(text + "\n");
  }

  close(): void {
    this.rl.close();
  }
}

export class ToolPrompt {
  private readonly io: IPromptIO;

  constructor(io: IPromptIO) {
    this.io = io;
  }

  async confirm(message: string, defaultValue = true): Promise<boolean> {
    const hint = defaultValue ? "Y/n" : "y/N";
    const answer = await this.io.question(`${message} [${hint}]: `);
    const trimmed = answer.trim().toLowerCase();
    if (trimmed === "") return defaultValue;
    return trimmed === "y" || trimmed === "yes";
  }

  async select<T>(message: string, options: ReadonlyArray<ISelectOption<T>>): Promise<T> {
    this.io.write(`\n${message}`);
    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const rec = opt.recommended ? " (recommended)" : "";
      this.io.write(`  ${i + 1}) ${opt.label}${rec}`);
    }

    const answer = await this.io.question("\nChoice: ");
    const trimmed = answer.trim();
    const index = Number(trimmed) - 1;

    if (Number.isNaN(index) || index < 0 || index >= options.length) {
      const recommended = options.find(o => o.recommended);
      if (recommended) return recommended.value;
      return options[0].value;
    }

    return options[index].value;
  }

  async input(message: string, defaultValue?: string): Promise<string> {
    const hint = defaultValue !== undefined ? ` (${defaultValue})` : "";
    const answer = await this.io.question(`${message}${hint}: `);
    const trimmed = answer.trim();
    if (trimmed === "" && defaultValue !== undefined) return defaultValue;
    return trimmed;
  }

  printBanner(): void {
    this.io.write("");
    this.io.write("  tyforge-lint setup");
    this.io.write("  ==================");
    this.io.write("");
  }

  printSuccess(msg: string): void {
    this.io.write(`  [ok] ${msg}`);
  }

  printInfo(msg: string): void {
    this.io.write(`  [info] ${msg}`);
  }

  printPreview(actions: ReadonlyArray<string>): void {
    this.io.write("\n  Planned actions:");
    for (const action of actions) {
      this.io.write(`    - ${action}`);
    }
    this.io.write("");
  }

  close(): void {
    this.io.close();
  }
}
