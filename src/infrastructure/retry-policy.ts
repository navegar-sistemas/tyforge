export interface RetryPolicyConfig {
  maxRetries: number;
  delay: number;
  backoffStrategy: "linear" | "exponential";
}

export interface RetryPolicy {
  execute<T>(fn: () => Promise<T>): Promise<T>;
}
