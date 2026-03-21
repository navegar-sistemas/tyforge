export interface OutboxEntry {
  id: string;
  eventName: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  publishedAt?: Date;
  retryCount: number;
}
