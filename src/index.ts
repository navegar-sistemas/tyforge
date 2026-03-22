// ── Result Pattern ──────────────────────────────────────────────
export type { Result, ResultPromise } from "./result/result";
export { ok, err, isSuccess, isFailure, map, flatMap, fold, match, getOrElse, orElse, all, toPromise, OK_TRUE, OK_FALSE } from "./result/result";

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
export type { ICompiledSchema } from "./schema/schema-build";
export type {
  IFieldConfig,
  ISchema,
  SchemaEntry,
  InferProps,
  InferJson,
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
export { FDateTimeISOZMillis, FDateTimeISOZ, FDateISODate, FDateISOCompact, FDateTimeISOCompact, FDateTimeISOFullCompact } from "./type-fields/date.format_vo";
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
export { FAppStatus, OAppStatus } from "./type-fields/app-status.format_vo";

// ── Domain Models ───────────────────────────────────────────────
export type { TClassInfo } from "./domain-models/class.base";
export { Aggregate } from "./domain-models/agreggate.base";
export { Entity } from "./domain-models/entity.base";
export type { IEntityPropsBase } from "./domain-models/entity.base";
export { ValueObject } from "./domain-models/value-object.base";
export { Dto } from "./domain-models/dto.base";
export type { TDtoPropsBase, TDtoPropsJson } from "./domain-models/dto.base";
export { DtoResponse } from "./domain-models/dto-response.base";
export type { TDtoResponsePropsBase, TDtoResponsePropsJson } from "./domain-models/dto-response.base";
export { DomainEvent } from "./domain-models/domain-event.base";
export type { IRepositoryBase, IRepositoryBaseOptions } from "./domain-models/base-repository.interface";
export { DomainEventDispatcher } from "./domain-models/domain-event-dispatcher";

// ── Domain ─────────────────────────────────────────────────────
export { Specification } from "./domain/specification";
export type { IPolicy } from "./domain/policy";
export type { IFactory } from "./domain/factory";
export type { IRepositoryRead } from "./domain/read-repository";
export type { IDomainService } from "./domain/domain-service";
export type { ISoftDeletable } from "./domain/soft-deletable";
export type { IVersioned } from "./domain/versioned";

// ── Application ────────────────────────────────────────────────
export { UseCase } from "./application/use-case";
export type { IMapper } from "./application/mapper";
export type { ICommand, IQuery, ICommandHandler, IQueryHandler, ICommandBus, IQueryBus } from "./application/cqrs";
export { IntegrationEvent } from "./application/integration-event";
export { Saga } from "./application/saga";
export type { ISagaStep } from "./application/saga";
export type { IEventHandler } from "./application/event-handler";
export type { IEventBus } from "./application/event-bus";
export type { IInputDto } from "./application/input-dto";
export type { IPort } from "./application/port";
export type { IPipelineBehavior } from "./application/pipeline-behavior";

// ── Infrastructure ─────────────────────────────────────────────
export type { IUnitOfWork } from "./infrastructure/unit-of-work";
export type { IOutbox } from "./infrastructure/outbox";
export type { IOutboxEntry } from "./infrastructure/outbox-entry";
export type { IIdempotencyKey } from "./infrastructure/idempotency-key";
export type { IRetryPolicy, IRetryPolicyConfig } from "./infrastructure/retry-policy";
export type { ICircuitBreaker, ICircuitBreakerConfig, CircuitBreakerState } from "./infrastructure/circuit-breaker";
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

// ── Constants ───────────────────────────────────────────────────
export { OHttpStatus, type THttpStatus } from "./constants/http-status.constants";
