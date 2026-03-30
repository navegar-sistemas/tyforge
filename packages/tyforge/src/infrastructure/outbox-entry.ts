import type { FId } from "@tyforge/type-fields/identity/id.typefield";
import type { FString } from "@tyforge/type-fields/primitive/string.typefield";
import type { FInt } from "@tyforge/type-fields/primitive/int.typefield";
import type { FDateTimeISOZMillis } from "@tyforge/type-fields/primitive/date.typefield";

export interface IOutboxEntry {
  id: FId;
  eventName: FString;
  payload: Record<string, unknown>;
  occurredAt: FDateTimeISOZMillis;
  publishedAt?: FDateTimeISOZMillis;
  retryCount: FInt;
}
