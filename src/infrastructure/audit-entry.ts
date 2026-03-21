export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  resource: string;
  resourceId?: string;
  timestamp: Date;
  details?: Record<string, unknown>;
  ip?: string;
}
