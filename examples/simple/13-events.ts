import { DomainEvent, FString } from "tyforge";

// ═══════════════════════════════════════════════════════════════════
// Reusable Domain Events — imported by other examples
// ═══════════════════════════════════════════════════════════════════

// ─── EventUserRegistered ───

export interface TEventUserRegisteredPayload extends Record<string, unknown> {
  userId: string;
  email: string;
}

export class EventUserRegistered extends DomainEvent<TEventUserRegisteredPayload> {
  protected readonly _classInfo = { name: "EventUserRegistered", version: "1.0.0", description: "User registration event" };
  readonly queueName = FString.createOrThrow("user-events");

  static create(payload: TEventUserRegisteredPayload): EventUserRegistered {
    return new EventUserRegistered("user.registered", payload);
  }
}

// ─── EventOrderCreated ───

export interface TEventOrderCreatedPayload extends Record<string, unknown> {
  orderId: string;
  customerEmail: string;
  total: number;
}

export class EventOrderCreated extends DomainEvent<TEventOrderCreatedPayload> {
  protected readonly _classInfo = { name: "EventOrderCreated", version: "1.0.0", description: "Order creation event" };
  readonly queueName = FString.createOrThrow("order-events");

  static create(payload: TEventOrderCreatedPayload): EventOrderCreated {
    return new EventOrderCreated("order.created", payload);
  }
}
