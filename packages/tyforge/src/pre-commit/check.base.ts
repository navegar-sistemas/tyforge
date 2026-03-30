export type TCheckSeverity = "blocking" | "confirmable";

export interface ICheckResult {
  status: "pass" | "warn" | "fail";
  name: string;
  details: string[];
}

export interface IExecErrorOptions {
  stream?: "stdout" | "stderr" | "both";
  filter?: (line: string) => boolean;
  limit?: number;
}

import { execFileSync } from "node:child_process";

export abstract class Check {
  constructor(
    readonly name: string,
    readonly severity: TCheckSeverity,
  ) {}

  abstract run(): Promise<ICheckResult>;

  protected pass(details: string[] = []): ICheckResult {
    return { status: "pass", name: this.name, details };
  }

  protected warn(details: string[]): ICheckResult {
    return { status: "warn", name: this.name, details };
  }

  protected fail(details: string[]): ICheckResult {
    return { status: "fail", name: this.name, details };
  }

  protected extractError(e: unknown, options: IExecErrorOptions = {}): string[] {
    const { stream = "both", filter, limit = 20 } = options;
    if (!(e instanceof Error)) return [String(e)];

    const lines: string[] = [];

    const getProperty = (obj: Error, key: string): string => {
      if (key in obj) {
        const val = Object.getOwnPropertyDescriptor(obj, key)?.value;
        return typeof val === "string" ? val : "";
      }
      return "";
    };

    if (stream === "stdout" || stream === "both") {
      const stdout = getProperty(e, "stdout");
      if (stdout) lines.push(...stdout.split("\n"));
    }
    if (stream === "stderr" || stream === "both") {
      const stderr = getProperty(e, "stderr");
      if (stderr) lines.push(...stderr.split("\n"));
    }

    const nonEmpty = lines.filter(Boolean);
    const filtered = filter ? nonEmpty.filter(filter) : nonEmpty;
    return filtered.slice(0, limit);
  }

  protected findFiles(namePatterns: string[], excludes: string[] = ["node_modules", "dist", "build"]): string[] {
    const args: string[] = ["."];
    // Build name pattern: \( -name "X" -o -name "Y" \)
    if (namePatterns.length === 1) {
      args.push("-name", namePatterns[0]);
    } else {
      args.push("(");
      for (let i = 0; i < namePatterns.length; i++) {
        if (i > 0) args.push("-o");
        args.push("-name", namePatterns[i]);
      }
      args.push(")");
    }
    // Excludes
    for (const e of excludes) {
      args.push("-not", "-path", `*/${e}/*`);
    }
    try {
      const output = execFileSync("find", args, { stdio: "pipe", encoding: "utf-8", timeout: 10000 });
      return output.trim().split("\n").filter(Boolean);
    } catch {
      return [];
    }
  }

  protected findPackageJsonFiles(): string[] {
    return this.findFiles(["package.json"]);
  }

  protected findDockerfiles(): string[] {
    return this.findFiles(["Dockerfile", "Dockerfile.*"]);
  }

  protected isDockerAvailable(): boolean {
    try {
      execFileSync("docker", ["info"], { stdio: "pipe", timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }
}
