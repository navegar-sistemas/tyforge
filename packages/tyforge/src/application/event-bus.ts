import { DomainEvent } from "@tyforge/domain-models/domain-event.base";
import { IEventHandler } from "./event-handler";

export interface IEventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>,
  ): void;
}
