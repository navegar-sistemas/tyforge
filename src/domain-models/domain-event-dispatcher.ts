import { DomainEvent } from "./domain-event.base";

export type DomainEventHandler = (event: DomainEvent) => Promise<void>;

export interface IDispatchOptions {
  onError?: (event: DomainEvent, error: unknown) => void;
}

export interface IDispatchResult {
  dispatched: number;
  failed: { event: DomainEvent; error: unknown }[];
}

export class DomainEventDispatcher {
  private static handlers: Map<string, DomainEventHandler[]> = new Map();

  static register(eventName: string, handler: DomainEventHandler): void {
    const existing = this.handlers.get(eventName) ?? [];
    existing.push(handler);
    this.handlers.set(eventName, existing);
  }

  static async dispatch(
    events: ReadonlyArray<DomainEvent>,
    options?: IDispatchOptions,
  ): Promise<IDispatchResult> {
    let dispatched = 0;
    const failed: { event: DomainEvent; error: unknown }[] = [];

    for (const event of events) {
      const handlers = this.handlers.get(event.eventName) ?? [];
      for (const handler of handlers) {
        try {
          await handler(event);
          dispatched++;
        } catch (error: unknown) {
          failed.push({ event, error });
          if (options?.onError) {
            options.onError(event, error);
          }
        }
      }
    }

    return { dispatched, failed };
  }

  static clear(): void {
    this.handlers.clear();
  }
}
