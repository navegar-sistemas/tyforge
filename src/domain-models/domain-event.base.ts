import { v7 as uuidv7 } from "uuid";

export type TQueueName = string;

export abstract class DomainEvent<TPayload = Record<string, unknown>> {
  readonly id: string;
  readonly eventName: string;
  readonly payload: TPayload;
  readonly occurredAt: Date;
  readonly version: string = "1.0.0";
  abstract readonly queueName: TQueueName;

  constructor(eventName: string, payload: TPayload, occurredAt?: Date) {
    this.id = uuidv7();
    this.eventName = eventName;
    this.payload = payload;
    this.occurredAt = occurredAt ?? new Date();
  }

  toJSON() {
    return {
      id: this.id,
      eventName: this.eventName,
      payload: this.payload,
      occurredAt: this.occurredAt.toISOString(),
      version: this.version,
      queueName: this.queueName,
    };
  }
}
