import type { FInt } from "@tyforge/type-fields/primitive/int.typefield";

export const OCircuitBreakerState = { CLOSED: "closed", OPEN: "open", HALF_OPEN: "half-open" } as const;
export type TCircuitBreakerState = typeof OCircuitBreakerState[keyof typeof OCircuitBreakerState];

export interface ICircuitBreakerConfig {
  failureThreshold: FInt;
  resetTimeout: FInt;
}

export interface ICircuitBreaker {
  execute<T>(fn: () => Promise<T>): Promise<T>;
  getState(): TCircuitBreakerState;
}
