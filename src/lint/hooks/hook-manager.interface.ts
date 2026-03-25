export interface IHookSetupResult {
  readonly success: boolean;
  readonly hookPath: string;
  readonly message: string;
  readonly manualSteps: ReadonlyArray<string>;
}

export interface IHookManager {
  readonly name: string;
  setup(command: string, cwd: string): IHookSetupResult;
  remove(cwd: string): IHookSetupResult;
  isInstalled(cwd: string): boolean;
}
