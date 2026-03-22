export interface IRetryPolicyConfig {
  maxRetries: number;
  delay: number;
  backoffStrategy: "linear" | "exponential";
}

export interface IRetryPolicy {
  execute<T>(fn: () => Promise<T>): Promise<T>;
}
