export class ToolCliParser {
  private readonly args: string[];

  constructor(args: string[]) {
    this.args = args;
  }

  hasFlag(name: string): boolean {
    return this.args.includes(name);
  }

  getFlagValue(name: string): string | undefined {
    const idx = this.args.indexOf(name);
    if (idx === -1 || idx + 1 >= this.args.length) return undefined;
    return this.args[idx + 1];
  }

  getPositionalArgs(): string[] {
    const positional: string[] = [];
    for (let i = 0; i < this.args.length; i++) {
      const arg = this.args[i];
      if (arg.startsWith("--")) {
        if (i + 1 < this.args.length && !this.args[i + 1].startsWith("--")) {
          i++;
        }
        continue;
      }
      positional.push(arg);
    }
    return positional;
  }
}
