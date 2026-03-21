// ── Result Pattern ──────────────────────────────────────────────
export type { Result, ResultPromise } from "./result/result";
export { ok, err, isSuccess, isFailure, map, flatMap, fold, match, getOrElse, orElse, all, toPromise, OK_TRUE, OK_FALSE } from "./result/result";

// ── Exceptions ──────────────────────────────────────────────────
export { Exceptions } from "./exceptions/base.exceptions";
export { ExceptionValidation } from "./exceptions/validation.exception";
export { ExceptionBusiness } from "./exceptions/business.exception";
export { ExceptionNotFound } from "./exceptions/not-found.exception";
export { ExceptionDb } from "./exceptions/db.exception";
export { ExceptionAuth } from "./exceptions/auth.exception";
export { default as ExceptionUnexpected } from "./exceptions/unexpected";

// ── Schema ──────────────────────────────────────────────────────
export { SchemaBuilder } from "./schema/schema-build";
export type { CompiledSchema } from "./schema/schema-build";
export type {
  FieldConfig,
  Schema,
  SchemaEntry,
  InferProps,
  InferJson,
  // Backward-compatible re-exports
  ISchemaFieldConfig,
  ISchemaInlineObject,
  ISchemaInferProps,
  ISchemaInferJson,
} from "./schema/schema-types";

// ── Type Fields ─────────────────────────────────────────────────
export { TypeField } from "./type-fields/type-field.base";
export type { ITypeFieldConfig } from "./type-fields/type-field.config";
export { FId } from "./type-fields/id.format_vo";
export { FIdReq } from "./type-fields/id-req.format_vo";
export { FString } from "./type-fields/string.format_vo";
export { FText } from "./type-fields/text.format_vo";
export { FEmail } from "./type-fields/email.format_vo";
export { FPassword } from "./type-fields/password.format_vo";
export { FBoolean } from "./type-fields/boolean.format_vo";
export { FInt } from "./type-fields/int.format_vo";
export { FJson } from "./type-fields/json.format_vo";
export { FDateTimeISOZMillis, FDateTimeISOZ, FDateISODate, FDateISOCompact } from "./type-fields/date.format_vo";
export { FPageNumber } from "./type-fields/page-number.format_vo";
export { FPageSize } from "./type-fields/page-size.format_vo";
export { FFullName } from "./type-fields/full-name.format_vo";
export { FDescription } from "./type-fields/description.format_vo";
export { FApiKey } from "./type-fields/api-key.format_vo";
export { FBearer } from "./type-fields/bearer.format_vo";
export { FSignature } from "./type-fields/signature.format_vo";
export { FTraceId } from "./type-fields/trace-id.format_vo";
export { FPublicKeyPem } from "./type-fields/public-key-pem.format_vo";
export { FHttpStatus } from "./type-fields/http-status.format_vo";
export { FBoolInt } from "./type-fields/bool-int.format_vo";
export { FAppStatus } from "./type-fields/app-status.format_vo";

// ── Domain Models ───────────────────────────────────────────────
export { Aggregate } from "./domain-models/agreggate.base";
export { Entity } from "./domain-models/entity.base";
export type { IEntityPropsBase } from "./domain-models/entity.base";
export { ValueObject } from "./domain-models/value-object.base";
export { Dto } from "./domain-models/dto.base";
export type { TDtoPropsBase, TDtoPropsJson } from "./domain-models/dto.base";
export { DomainEvent } from "./domain-models/domain-event.base";
export type { IBaseRepository, IRepositoryOptions } from "./domain-models/base-repository.interface";
export { DomainEventDispatcher } from "./domain-models/domain-event-dispatcher";

// ── Domain ─────────────────────────────────────────────────────
export { Specification } from "./domain/specification";
export type { Policy } from "./domain/policy";
export type { Factory } from "./domain/factory";
export type { ReadRepository } from "./domain/read-repository";
export type { DomainService } from "./domain/domain-service";
export type { SoftDeletable } from "./domain/soft-deletable";
export type { Versioned } from "./domain/versioned";

// ── Application ────────────────────────────────────────────────
export { UseCase } from "./application/use-case";
export type { Mapper } from "./application/mapper";
export type { Command, Query, CommandHandler, QueryHandler, CommandBus, QueryBus } from "./application/cqrs";
export { IntegrationEvent } from "./application/integration-event";
export { Saga } from "./application/saga";
export type { SagaStep } from "./application/saga";
export type { EventHandler } from "./application/event-handler";
export type { EventBus } from "./application/event-bus";
export type { InputDto } from "./application/input-dto";
export type { OutputDto } from "./application/output-dto";
export type { Port } from "./application/port";
export type { PipelineBehavior } from "./application/pipeline-behavior";

// ── Infrastructure ─────────────────────────────────────────────
export type { UnitOfWork } from "./infrastructure/unit-of-work";
export { BaseOrmMapper } from "./infrastructure/base-orm-mapper";
export type { Outbox } from "./infrastructure/outbox";
export type { OutboxEntry } from "./infrastructure/outbox-entry";
export type { IdempotencyKey } from "./infrastructure/idempotency-key";
export type { RetryPolicy, RetryPolicyConfig } from "./infrastructure/retry-policy";
export type { CircuitBreaker, CircuitBreakerConfig, CircuitBreakerState } from "./infrastructure/circuit-breaker";
export type { AuditLog, AuditFilter } from "./infrastructure/audit-log";
export type { AuditEntry } from "./infrastructure/audit-entry";
export type { CorrelationContext } from "./infrastructure/correlation-context";

// ── Common ─────────────────────────────────────────────────────
export { Paginated } from "./common/paginated";
export type { PaginationParams } from "./common/pagination-params";
export { DefaultDateTimeProvider } from "./common/date-time-provider";
export type { DateTimeProvider } from "./common/date-time-provider";
export type { Logger } from "./common/logger";
export { Optional } from "./common/optional";

// ── Exceptions (extras) ────────────────────────────────────────
export { OptimisticLockException } from "./exceptions/optimistic-lock.exception";

// ── Tools ───────────────────────────────────────────────────────
export { TypeGuard } from "./tools/type_guard";
export { ToolParse } from "./tools/parse/parse.tool";
export { ToolFormattingDateISO8601 } from "./tools/formatting/date/date-formatting.tool";

// ── Constants ───────────────────────────────────────────────────
export { OHttpStatus, type THttpStatus } from "./constants/http-status.constants";
