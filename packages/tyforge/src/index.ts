// ── Config (types only — runtime via "tyforge/config" subpath) ──
export type { ITyForgeConfig, IResolvedTyForgeConfig, ILintConfigSection, TRuleSeverity } from "./config/tyforge-config";

// ── Result Pattern ──────────────────────────────────────────────
export type { Result, ResultPromise } from "./result/result";
export { ok, err, isSuccess, isFailure, map, flatMap, fold, match, getOrElse, orElse, all, allSettled, toPromise, OK_TRUE, OK_FALSE } from "./result/result";

// ── Exceptions ──────────────────────────────────────────────────
export { Exceptions } from "./exceptions/base.exceptions";
export type { IExceptionDetails } from "./exceptions/base.exceptions";
export { ExceptionValidation } from "./exceptions/validation.exception";
export { ExceptionBusiness } from "./exceptions/business.exception";
export { ExceptionNotFound } from "./exceptions/not-found.exception";
export { ExceptionDb } from "./exceptions/db.exception";
export { ExceptionAuth } from "./exceptions/auth.exception";
export { ExceptionUnexpected } from "./exceptions/unexpected.exception";
export { ExceptionGeneric } from "./exceptions/generic.exception";
export { ExceptionImplementation } from "./exceptions/implementation.exception";
export { ExceptionInterface } from "./exceptions/interface.exception";
export { ExceptionOptimisticLock } from "./exceptions/optimistic-lock.exception";
export { ExceptionBooleanInvalid } from "./exceptions/boolean.exception";
export { ExceptionDate } from "./exceptions/date.exception";
export { ExceptionId } from "./exceptions/id.exception";
export { ExceptionIntInvalid } from "./exceptions/int.exception";
export { ExceptionJson } from "./exceptions/json.exception";
export { ExceptionString } from "./exceptions/string.exception";
export { ExceptionText } from "./exceptions/text.exception";

// ── Schema ──────────────────────────────────────────────────────
export { SchemaBuilder } from "./schema/schema-build";
export type { ICompiledSchema, IBatchCreateError, IBatchCreateOptions, IBatchCreateResult } from "./schema/schema-build";
export type {
  IFieldConfig,
  ISchema,
  SchemaEntry,
  InferProps,
  InferJson,
  TExposeLevel,
} from "./schema/schema-types";
export { OExposeLevel, getVisibilityLevel } from "./schema/schema-types";
export { composeSchema } from "./schema/schema-compose";

// ── Type Fields ─────────────────────────────────────────────────
export * from "./type-fields";

// ── Domain Models ───────────────────────────────────────────────
export type { TClassInfo, TClassMetadata } from "./domain-models/class.base";
export { ClassDomainModels } from "./domain-models/class-domain-models.base";
export { Aggregate } from "./domain-models/aggregate.base";
export { Entity } from "./domain-models/entity.base";
export type { IEntityProps } from "./domain-models/entity.base";
export { ValueObject } from "./domain-models/value-object.base";
export { Dto } from "./domain-models/dto.base";
export { DtoReq } from "./domain-models/dto-req.base";
export type { TDtoReqProps, TDtoReqPropsJson } from "./domain-models/dto-req.base";
export { DtoRes } from "./domain-models/dto-res.base";
export type { TDtoResProps, TDtoResPropsJson } from "./domain-models/dto-res.base";
export { DomainEvent } from "./domain-models/domain-event.base";
export { RepositoryCrud } from "./domain-models/base-repository.interface";
export { DomainEventDispatcher } from "./domain-models/domain-event-dispatcher";
export type { DomainEventHandler, IDispatchOptions, IDispatchResult } from "./domain-models/domain-event-dispatcher";

// ── Domain ─────────────────────────────────────────────────────
export { Specification } from "./domain/specification";
export type { IPolicy } from "./domain/policy";
export type { IFactory } from "./domain/factory";
export { Repository } from "./domain/repository";
export { RepositoryRead } from "./domain/read-repository";
export { RepositoryWrite } from "./domain/write-repository";
export type { IDomainService } from "./domain/domain-service";
export type { ISoftDeletable } from "./domain/soft-deletable";
export type { IVersioned } from "./domain/versioned";

// ── Application ────────────────────────────────────────────────
export { UseCase } from "./application/use-case";
export type { IMapper } from "./application/mapper";
export type { ICommand, IQuery, ICommandHandler, IQueryHandler, ICommandBus, IQueryBus } from "./application/cqrs";
export { IntegrationEvent } from "./application/integration-event";
export { Saga, SagaContext } from "./application/saga";
export type { ISagaStep, ISagaContext } from "./application/saga";
export type { IEventHandler } from "./application/event-handler";
export type { IEventBus } from "./application/event-bus";
export type { IInputDto } from "./application/input-dto";
export type { IPort } from "./application/port";
export type { IPipelineBehavior } from "./application/pipeline-behavior";

// ── Infrastructure ─────────────────────────────────────────────
// ServiceBase available via "tyforge/infrastructure/service-base" subpath (Node.js only)
export type { IUnitOfWork } from "./infrastructure/unit-of-work";
export type { IOutbox } from "./infrastructure/outbox";
export type { IOutboxEntry } from "./infrastructure/outbox-entry";
export type { IIdempotencyKey } from "./infrastructure/idempotency-key";
export { OBackoffStrategy } from "./infrastructure/retry-policy";
export type { IRetryPolicy, IRetryPolicyConfig, TBackoffStrategy } from "./infrastructure/retry-policy";
export { OCircuitBreakerState } from "./infrastructure/circuit-breaker";
export type { ICircuitBreaker, ICircuitBreakerConfig, TCircuitBreakerState } from "./infrastructure/circuit-breaker";
export type { IAuditLog, IAuditFilter } from "./infrastructure/audit-log";
export type { IAuditEntry } from "./infrastructure/audit-entry";
export type { ICorrelationContext } from "./infrastructure/correlation-context";

// ── Common ─────────────────────────────────────────────────────
export { Paginated } from "./common/paginated";
export type { IPaginationParams } from "./common/pagination-params";
export { DefaultDateTimeProvider } from "./common/date-time-provider";
export type { IDateTimeProvider } from "./common/date-time-provider";
export type { ILogger } from "./common/logger";
export { Optional } from "./common/optional";

// ── Tools ───────────────────────────────────────────────────────
export { TypeGuard } from "./tools/type_guard";
export { ToolParse } from "./tools/parse/parse.tool";
export { ToolFormattingDateISO8601 } from "./tools/formatting/date/date-formatting.tool";
export { ToolObjectTransform } from "./tools/object-transform.tool";
export { ToolHeaderSecurity } from "./tools/header-security.tool";
// ToolNetworkSecurity available via "tyforge/tools/network-security" subpath (Node.js only)

