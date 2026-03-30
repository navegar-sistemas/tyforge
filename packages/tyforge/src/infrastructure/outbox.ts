import type { FId } from "@tyforge/type-fields/identity/id.typefield";
import type { DomainEvent } from "@tyforge/domain-models/domain-event.base";
import type { IOutboxEntry } from "./outbox-entry";

export interface IOutbox {
  store(event: DomainEvent): Promise<void>;
  markAsPublished(eventId: FId): Promise<void>;
  getPending(): Promise<IOutboxEntry[]>;
}
