import { ClassDomainModels } from "./class-domain-models.base";
import { FId } from "@tyforge/type-fields/identity/id.typefield";
import { FString } from "@tyforge/type-fields/primitive/string.typefield";
import { FDateTimeISOZMillis } from "@tyforge/type-fields/primitive/date.typefield";
import type { ISchema, InferProps, InferJson } from "@tyforge/schema/schema-types";

const domainEventSchema = {
  id: { type: FId },
  eventName: { type: FString },
  version: { type: FString },
  occurredAt: { type: FDateTimeISOZMillis },
  queueName: { type: FString },
} satisfies ISchema;

type TDomainEventProps = InferProps<typeof domainEventSchema>;
type TDomainEventJson = InferJson<typeof domainEventSchema>;


export abstract class DomainEvent<TPayload = Record<string, unknown>> extends ClassDomainModels<TDomainEventProps, TDomainEventJson> {
  protected readonly _schema = domainEventSchema;
  readonly id: FId;
  readonly eventName: FString;
  readonly occurredAt: FDateTimeISOZMillis;
  readonly version: FString;
  readonly payload: TPayload;
  abstract readonly queueName: FString;

  protected constructor(eventName: string, payload: TPayload, occurredAt?: Date) {
    super();
    this.id = FId.generate();
    this.eventName = FString.createOrThrow(eventName);
    this.payload = payload;
    this.occurredAt = FDateTimeISOZMillis.createOrThrow(occurredAt ?? new Date());
    this.version = FString.createOrThrow("1.0.0");
  }

  equals(input: ClassDomainModels<TDomainEventProps, TDomainEventJson>): boolean {
    if (!input || input.constructor !== this.constructor) return false;
    if (input instanceof DomainEvent) {
      return this.id.getValue() === input.id.getValue();
    }
    return false;
  }
}
