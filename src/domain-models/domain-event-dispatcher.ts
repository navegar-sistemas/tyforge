import { DomainEvent } from "./domain-event.base";

export type DomainEventHandler = (event: DomainEvent) => Promise<void>;

export class DomainEventDispatcher {
  private static handlers: Map<string, DomainEventHandler[]> = new Map();

  static register(eventName: string, handler: DomainEventHandler): void {
    const existing = this.handlers.get(eventName) ?? [];
    existing.push(handler);
    this.handlers.set(eventName, existing);
  }

  static async dispatch(events: ReadonlyArray<DomainEvent>): Promise<void> {
    for (const event of events) {
      const handlers = this.handlers.get(event.eventName) ?? [];
      for (const handler of handlers) {
        await handler(event);
      }
    }
  }

  static clear(): void {
    this.handlers.clear();
  }
}
