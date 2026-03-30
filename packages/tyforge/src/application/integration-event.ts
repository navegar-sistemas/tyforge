import { ClassDomainModels } from "@tyforge/domain-models/class-domain-models.base";
import { FId } from "@tyforge/type-fields/identity/id.typefield";
import { FString } from "@tyforge/type-fields/primitive/string.typefield";
import { FDateTimeISOZMillis } from "@tyforge/type-fields/primitive/date.typefield";
import type { ISchema, InferProps, InferJson } from "@tyforge/schema/schema-types";

const integrationEventSchema = {
  id: { type: FId },
  eventName: { type: FString },
  source: { type: FString },
  version: { type: FString },
  occurredAt: { type: FDateTimeISOZMillis },
} satisfies ISchema;

type TIntegrationEventProps = InferProps<typeof integrationEventSchema>;
type TIntegrationEventJson = InferJson<typeof integrationEventSchema>;


export abstract class IntegrationEvent<TPayload = Record<string, unknown>> extends ClassDomainModels<TIntegrationEventProps, TIntegrationEventJson> {
  protected readonly _schema = integrationEventSchema;
  readonly id: FId;
  readonly eventName: FString;
  readonly occurredAt: FDateTimeISOZMillis;
  abstract readonly source: FString;
  readonly version: FString;
  readonly payload: TPayload;

  protected constructor(eventName: string, payload: TPayload, occurredAt?: Date) {
    super();
    this.id = FId.generate();
    this.eventName = FString.createOrThrow(eventName);
    this.payload = payload;
    this.occurredAt = FDateTimeISOZMillis.createOrThrow(occurredAt ?? new Date());
    this.version = FString.createOrThrow("1.0.0");
  }

  equals(input: ClassDomainModels<TIntegrationEventProps, TIntegrationEventJson>): boolean {
    if (!input || input.constructor !== this.constructor) return false;
    if (input instanceof IntegrationEvent) {
      return this.id.getValue() === input.id.getValue();
    }
    return false;
  }
}
