import type { FCorrelationId } from "@tyforge/type-fields/tracking/correlation-id.typefield";

export interface ICorrelationContext {
  correlationId: FCorrelationId;
}
