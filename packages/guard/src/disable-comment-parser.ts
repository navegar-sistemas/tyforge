export interface IDisableState {
  isDisabled(lineNumber: number, ruleName: string): boolean;
}

export class DisableCommentParser {
  parse(lines: string[]): IDisableState {
    const disabledNextLine = new Map<number, string[] | "all">();
    const disabledSameLine = new Map<number, string[] | "all">();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const nextLine = this.parseDirective(line, "tyforge-guard-disable-next-line");
      if (nextLine) disabledNextLine.set(i + 1, nextLine);

      const sameLine = this.parseDirective(line, "tyforge-guard-disable-line");
      if (sameLine) disabledSameLine.set(i, sameLine);
    }

    return {
      isDisabled(lineNumber: number, ruleName: string): boolean {
        const next = disabledNextLine.get(lineNumber);
        if (next && (next === "all" || next.includes(ruleName))) return true;

        const same = disabledSameLine.get(lineNumber);
        if (same && (same === "all" || same.includes(ruleName))) return true;

        return false;
      },
    };
  }

  private parseDirective(line: string, directive: string): string[] | "all" | null {
    const idx = line.indexOf(directive);
    if (idx === -1) return null;

    const after = line.slice(idx + directive.length).trim();
    if (!after || after.startsWith("//") || after.startsWith("*/")) return "all";

    return after.split(/\s+/).filter(Boolean);
  }
}
