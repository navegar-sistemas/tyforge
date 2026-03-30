import { DomainEvent } from "@tyforge/domain-models/domain-event.base";

export interface IEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}
