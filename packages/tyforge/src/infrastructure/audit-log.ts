import type { FString } from "@tyforge/type-fields/primitive/string.typefield";
import type { FDateTimeISOZMillis } from "@tyforge/type-fields/primitive/date.typefield";
import type { IAuditEntry } from "./audit-entry";

export interface IAuditFilter {
  action?: FString;
  actor?: FString;
  resource?: FString;
  from?: FDateTimeISOZMillis;
  to?: FDateTimeISOZMillis;
}

export interface IAuditLog {
  log(entry: IAuditEntry): Promise<void>;
  query(filter: IAuditFilter): Promise<IAuditEntry[]>;
}
