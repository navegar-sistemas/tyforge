export type SagaStatus =
  | "pending"
  | "running"
  | "completed"
  | "compensating"
  | "failed";

function assertType<T>(value: unknown): asserts value is T {
  void value;
}

export interface ISagaContext {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
}

export class SagaContext implements ISagaContext {
  private readonly store: Map<string, unknown> = new Map();

  get<T>(key: string): T | undefined {
    const value = this.store.get(key);
    if (value === undefined) return undefined;
    assertType<T>(value);
    return value;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, value);
  }
}

export abstract class Saga {
  protected status: SagaStatus = "pending";
  protected context: ISagaContext = new SagaContext();

  abstract start(): Promise<void>;
  abstract compensate(): Promise<void>;

  getStatus(): SagaStatus {
    return this.status;
  }
}

export interface ISagaStep<TInput, TOutput> {
  execute(input: TInput, context: ISagaContext): Promise<TOutput>;
  compensate(input: TInput, context: ISagaContext): Promise<void>;
}
