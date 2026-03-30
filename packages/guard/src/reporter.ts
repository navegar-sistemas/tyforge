import type { IRuleViolation } from "./rule";

export interface IReporter {
  report(violations: IRuleViolation[], fixCount?: number): void;
}
