export type SagaStatus = "pending" | "running" | "completed" | "compensating" | "failed";

export abstract class Saga {
  protected status: SagaStatus = "pending";

  abstract start(): Promise<void>;
  abstract compensate(): Promise<void>;

  getStatus(): SagaStatus {
    return this.status;
  }
}

export interface SagaStep<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
  compensate(input: TInput): Promise<void>;
}
