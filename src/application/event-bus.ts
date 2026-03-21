import { DomainEvent } from "@tyforge/domain-models/domain-event.base";
import { EventHandler } from "./event-handler";

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void;
}
