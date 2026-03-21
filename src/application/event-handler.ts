import { DomainEvent } from "@tyforge/domain-models/domain-event.base";

export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}
