import { DomainEvent } from "@tyforge/domain-models/domain-event.base";
import { IOutboxEntry } from "./outbox-entry";

export interface IOutbox {
  store(event: DomainEvent): Promise<void>;
  markAsPublished(eventId: string): Promise<void>;
  getPending(): Promise<IOutboxEntry[]>;
}
