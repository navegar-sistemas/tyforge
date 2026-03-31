import type { FInt } from "@tyforge/type-fields/primitive/int.typefield";

export const OBackoffStrategy = {
  LINEAR: "linear",
  EXPONENTIAL: "exponential",
} as const;
export type TBackoffStrategy =
  (typeof OBackoffStrategy)[keyof typeof OBackoffStrategy];

export interface IRetryPolicyConfig {
  maxRetries: FInt;
  delay: FInt;
  maxDelay?: FInt;
  backoffStrategy: TBackoffStrategy;
}

export interface IRetryPolicy {
  execute<T>(fn: () => Promise<T>): Promise<T>;
}
