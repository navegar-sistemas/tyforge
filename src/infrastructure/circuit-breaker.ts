export type CircuitBreakerState = "closed" | "open" | "half-open";

export interface ICircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
}

export interface ICircuitBreaker {
  execute<T>(fn: () => Promise<T>): Promise<T>;
  getState(): CircuitBreakerState;
}
