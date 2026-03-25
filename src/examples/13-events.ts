import { DomainEvent } from "@tyforge/index";

// ═══════════════════════════════════════════════════════════════════
// Reusable Domain Events — imported by other examples
// ═══════════════════════════════════════════════════════════════════

// ─── EventUserRegistered ───

export interface TEventUserRegisteredPayload extends Record<string, unknown> {
  userId: string;
  email: string;
}

export class EventUserRegistered extends DomainEvent<TEventUserRegisteredPayload> {
  readonly queueName = "user-events";

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
  readonly queueName = "order-events";

  static create(payload: TEventOrderCreatedPayload): EventOrderCreated {
    return new EventOrderCreated("order.created", payload);
  }
}
