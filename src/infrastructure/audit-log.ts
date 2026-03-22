import { IAuditEntry } from "./audit-entry";

export interface IAuditFilter {
  action?: string;
  actor?: string;
  resource?: string;
  from?: Date;
  to?: Date;
}

export interface IAuditLog {
  log(entry: IAuditEntry): Promise<void>;
  query(filter: IAuditFilter): Promise<IAuditEntry[]>;
}
