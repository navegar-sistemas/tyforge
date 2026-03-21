import { AuditEntry } from "./audit-entry";

export interface AuditFilter {
  action?: string;
  actor?: string;
  resource?: string;
  from?: Date;
  to?: Date;
}

export interface AuditLog {
  log(entry: AuditEntry): Promise<void>;
  query(filter: AuditFilter): Promise<AuditEntry[]>;
}
