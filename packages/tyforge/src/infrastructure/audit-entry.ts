import type { FId } from "@tyforge/type-fields/identity/id.typefield";
import type { FString } from "@tyforge/type-fields/primitive/string.typefield";
import type { FDateTimeISOZMillis } from "@tyforge/type-fields/primitive/date.typefield";

export interface IAuditEntry {
  id: FId;
  action: FString;
  actor: FString;
  resource: FString;
  resourceId?: FId;
  timestamp: FDateTimeISOZMillis;
  details?: Record<string, unknown>;
  ip?: FString;
}
