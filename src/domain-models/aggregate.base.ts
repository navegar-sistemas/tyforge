import { Entity, IEntityProps } from "./entity.base";
import { DomainEvent } from "./domain-event.base";

export abstract class Aggregate<
  TProps extends IEntityProps,
  TPropsJson = unknown,
> extends Entity<TProps, TPropsJson> {
  private _domainEvents: DomainEvent[] = [];

  protected constructor() {
    super();
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getDomainEvents(): ReadonlyArray<DomainEvent> {
    return Object.freeze([...this._domainEvents]);
  }

  /**
   * Clears all domain events. MUST be called after events are dispatched
   * to prevent memory leaks in long-lived aggregates.
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
