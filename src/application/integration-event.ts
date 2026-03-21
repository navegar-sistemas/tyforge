import { v7 as uuidv7 } from "uuid";
import { assertType } from "@tyforge/common/assert-type";

export abstract class IntegrationEvent<TPayload, TPropsJson = TPayload> {
  readonly id: string;
  readonly occurredAt: Date;
  abstract readonly eventName: string;
  abstract readonly source: string;
  readonly version: string = "1.0.0";
  readonly payload: TPayload;

  constructor(payload: TPayload, occurredAt?: Date) {
    this.id = uuidv7();
    this.payload = payload;
    this.occurredAt = occurredAt ?? new Date();
  }

  toJSON(): TPropsJson {
    const json = {
      id: this.id,
      eventName: this.eventName,
      source: this.source,
      version: this.version,
      payload: this.payload,
      occurredAt: this.occurredAt.toISOString(),
    };
    assertType<TPropsJson>(json);
    return json;
  }
}
