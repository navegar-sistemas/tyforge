import { Result, ok } from "@tyforge/result";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { ExceptionUnexpected } from "@tyforge/exceptions/unexpected.exception";
import { FString } from "@tyforge/type-fields/primitive/string.typefield";
import { FInt } from "@tyforge/type-fields/primitive/int.typefield";
import { DomainEvent } from "./domain-event.base";

export type DomainEventHandler = (event: DomainEvent) => Promise<void>;

export interface IDispatchOptions {
  onError?: (event: DomainEvent, error: Exceptions) => void;
}

export interface IDispatchResult {
  dispatched: FInt;
  failed: ReadonlyArray<{ event: DomainEvent; error: Exceptions }>;
}

export class DomainEventDispatcher {
  private static handlers: Map<string, DomainEventHandler[]> = new Map();

  static register(eventName: FString, handler: DomainEventHandler): void {
    const key = eventName.getValue();
    const existing = this.handlers.get(key) ?? [];
    existing.push(handler);
    this.handlers.set(key, existing);
  }

  static async dispatch(
    events: ReadonlyArray<DomainEvent>,
    options?: IDispatchOptions,
  ): Promise<Result<IDispatchResult, Exceptions>> {
    let dispatched = 0;
    const failed: { event: DomainEvent; error: Exceptions }[] = [];

    for (const event of events) {
      const handlers = this.handlers.get(event.eventName.getValue()) ?? [];
      for (const handler of handlers) {
        try {
          await handler(event);
          dispatched++;
        } catch (error: unknown) {
          const wrapped = error instanceof Exceptions
            ? error
            : ExceptionUnexpected.create();
          failed.push({ event, error: wrapped });
          if (options?.onError) {
            options.onError(event, wrapped);
          }
        }
      }
    }

    return ok({ dispatched: FInt.createOrThrow(dispatched), failed });
  }

  static clear(): void {
    this.handlers.clear();
  }
}
