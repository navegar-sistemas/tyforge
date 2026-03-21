import { DomainEvent } from "@tyforge/domain-models/domain-event.base";
import { OutboxEntry } from "./outbox-entry";

export interface Outbox {
  store(event: DomainEvent): Promise<void>;
  markAsPublished(eventId: string): Promise<void>;
  getPending(): Promise<OutboxEntry[]>;
}
