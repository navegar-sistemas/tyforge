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
export { TypeField } from "./type-fields/type-field.base";
export type { TJsonSchemaType, TValidationLevel } from "./type-fields/type-field.base";
export type { ITypeFieldConfig } from "./type-fields/type-field.config";
export { FBankAccountNumber } from "./type-fields/bank-account-number.format_vo";
export type { TBankAccountNumber, TBankAccountNumberFormatted } from "./type-fields/bank-account-number.format_vo";
export { FBankCode } from "./type-fields/bank-code.format_vo";
export type { TBankCode, TBankCodeFormatted } from "./type-fields/bank-code.format_vo";
export { FBankBranch } from "./type-fields/bank-branch.format_vo";
export type { TBankBranch, TBankBranchFormatted } from "./type-fields/bank-branch.format_vo";
export { FIdentifier } from "./type-fields/identifier.format_vo";
export type { TIdentifier, TIdentifierFormatted } from "./type-fields/identifier.format_vo";
export { FId } from "./type-fields/id.format_vo";
export type { TId, TIdFormatted } from "./type-fields/id.format_vo";
export { FIdReq } from "./type-fields/id-req.format_vo";
export type { TIdReq, TIdReqFormatted } from "./type-fields/id-req.format_vo";
export { FDocumentStateRegistration } from "./type-fields/document-state-registration.format_vo";
export type { TDocumentStateRegistration, TDocumentStateRegistrationFormatted } from "./type-fields/document-state-registration.format_vo";
export { FString } from "./type-fields/string.format_vo";
export type { TString, TStringFormatted } from "./type-fields/string.format_vo";
export { FText } from "./type-fields/text.format_vo";
export type { TText, TTextFormatted } from "./type-fields/text.format_vo";
export { FEmail } from "./type-fields/email.format_vo";
export type { TEmail, TEmailFormatted } from "./type-fields/email.format_vo";
export { FPassword } from "./type-fields/password.format_vo";
export type { TPassword, TPasswordFormatted } from "./type-fields/password.format_vo";
export { FPersonType, OPersonType } from "./type-fields/person-type.format_vo";
export type { TPersonType, TPersonTypeFormatted, TKeyPersonType } from "./type-fields/person-type.format_vo";
export { FBoolean } from "./type-fields/boolean.format_vo";
export type { TBoolean, TBooleanFormatted } from "./type-fields/boolean.format_vo";
export { FCorrelationId } from "./type-fields/correlation-id.format_vo";
export type { TCorrelationId, TCorrelationIdFormatted } from "./type-fields/correlation-id.format_vo";
export { FCurrency } from "./type-fields/currency.format_vo";
export type { TCurrency, TCurrencyFormatted } from "./type-fields/currency.format_vo";
export { FPixKey } from "./type-fields/pix-key.format_vo";
export type { TPixKey, TPixKeyFormatted } from "./type-fields/pix-key.format_vo";
export { FPixKeyType, OPixKeyType } from "./type-fields/pix-key-type.format_vo";
export type { TPixKeyType, TPixKeyTypeFormatted, TKeyPixKeyType } from "./type-fields/pix-key-type.format_vo";
export { FInt } from "./type-fields/int.format_vo";
export type { TInt, TIntFormatted } from "./type-fields/int.format_vo";
export { FJson } from "./type-fields/json.format_vo";
export type { TJson, TJsonFormatted } from "./type-fields/json.format_vo";
export { FMaritalStatus, OMaritalStatus } from "./type-fields/marital-status.format_vo";
export type { TMaritalStatus, TMaritalStatusFormatted, TKeyMaritalStatus } from "./type-fields/marital-status.format_vo";
export { FDocumentMunicipalRegistration } from "./type-fields/document-municipal-registration.format_vo";
export type { TDocumentMunicipalRegistration, TDocumentMunicipalRegistrationFormatted } from "./type-fields/document-municipal-registration.format_vo";
export { FMoney } from "./type-fields/money.format_vo";
export type { TMoney, TMoneyFormatted } from "./type-fields/money.format_vo";
export { FDate, FDateTimeISOZMillis, FDateTimeISOZ, FDateISODate, FDateISOCompact, FDateTimeISOCompact, FDateTimeISOFullCompact } from "./type-fields/date.format_vo";
export type { TDate, TDateFormatted, TfDate } from "./type-fields/date.format_vo";
export { FPageNumber } from "./type-fields/page-number.format_vo";
export type { TPageNumber, TPageNumberFormatted } from "./type-fields/page-number.format_vo";
export { FPageSize } from "./type-fields/page-size.format_vo";
export type { TPageSize, TPageSizeFormatted } from "./type-fields/page-size.format_vo";
export { FFullName } from "./type-fields/full-name.format_vo";
export type { TFullName, TFullNameFormatted } from "./type-fields/full-name.format_vo";
export { FGender, OGender } from "./type-fields/gender.format_vo";
export type { TGender, TGenderFormatted, TKeyGender } from "./type-fields/gender.format_vo";
export { FDescription } from "./type-fields/description.format_vo";
export type { TDescription, TDescriptionFormatted } from "./type-fields/description.format_vo";
export { FApiKey } from "./type-fields/api-key.format_vo";
export type { TApiKey, TApiKeyFormatted } from "./type-fields/api-key.format_vo";
export { FBearer } from "./type-fields/bearer.format_vo";
export type { TBearer, TBearerFormatted } from "./type-fields/bearer.format_vo";
export { FSignature } from "./type-fields/signature.format_vo";
export type { TSignature, TSignatureFormatted } from "./type-fields/signature.format_vo";
export { FTraceId } from "./type-fields/trace-id.format_vo";
export type { TTraceId, TTraceIdFormatted } from "./type-fields/trace-id.format_vo";
export { FTransactionId } from "./type-fields/transaction-id.format_vo";
export type { TTransactionId, TTransactionIdFormatted } from "./type-fields/transaction-id.format_vo";
export { FTransactionStatus, OTransactionStatus } from "./type-fields/transaction-status.format_vo";
export type { TTransactionStatus, TTransactionStatusFormatted, TKeyTransactionStatus } from "./type-fields/transaction-status.format_vo";
export { FDeviceId } from "./type-fields/device-id.format_vo";
export type { TDeviceId, TDeviceIdFormatted } from "./type-fields/device-id.format_vo";
export { FDocumentCnpj } from "./type-fields/document-cnpj.format_vo";
export type { TDocumentCnpj, TDocumentCnpjFormatted } from "./type-fields/document-cnpj.format_vo";
export { FDocumentRg } from "./type-fields/document-rg.format_vo";
export type { TDocumentRg, TDocumentRgFormatted } from "./type-fields/document-rg.format_vo";
export { FDocumentType, ODocumentType } from "./type-fields/document-type.format_vo";
export type { TDocumentType, TDocumentTypeFormatted, TKeyDocumentType } from "./type-fields/document-type.format_vo";
export { FDocumentCpf } from "./type-fields/document-cpf.format_vo";
export type { TDocumentCpf, TDocumentCpfFormatted } from "./type-fields/document-cpf.format_vo";
export { FDocumentCpfOrCnpj } from "./type-fields/document-cpf-or-cnpj.format_vo";
export type { TDocumentCpfOrCnpj, TDocumentCpfOrCnpjFormatted } from "./type-fields/document-cpf-or-cnpj.format_vo";
export { FBankNsu } from "./type-fields/bank-nsu.format_vo";
export type { TBankNsu, TBankNsuFormatted } from "./type-fields/bank-nsu.format_vo";
export { FBankE2eId } from "./type-fields/bank-e2e-id.format_vo";
export type { TBankE2eId, TBankE2eIdFormatted } from "./type-fields/bank-e2e-id.format_vo";
export { FEmvQrCodePayload } from "./type-fields/emv-qr-code-payload.format_vo";
export type { TEmvQrCodePayload, TEmvQrCodePayloadFormatted } from "./type-fields/emv-qr-code-payload.format_vo";
export { FPublicKeyPem } from "./type-fields/public-key-pem.format_vo";
export type { TPublicKeyPem, TPublicKeyPemFormatted } from "./type-fields/public-key-pem.format_vo";
export { FHashAlgorithm, OHashAlgorithm } from "./type-fields/hash-algorithm.format_vo";
export type { THashAlgorithm, THashAlgorithmFormatted, TKeyHashAlgorithm } from "./type-fields/hash-algorithm.format_vo";
export { FHttpStatus, OHttpStatus } from "./type-fields/http-status.format_vo";
export type { THttpStatus, THttpStatusFormatted, TKeyHttpStatus } from "./type-fields/http-status.format_vo";
export { FBoolInt, OBoolInt } from "./type-fields/bool-int.format_vo";
export type { TBoolInt, TBoolIntFormatted, TKeyBoolInt } from "./type-fields/bool-int.format_vo";
export { FAppStatus, OAppStatus } from "./type-fields/app-status.format_vo";
export type { TAppStatus, TAppStatusFormatted, TKeyAppStatus } from "./type-fields/app-status.format_vo";
export { FStateCode } from "./type-fields/state-code.format_vo";
export type { TStateCode, TStateCodeFormatted } from "./type-fields/state-code.format_vo";
export { FTotpCode } from "./type-fields/totp-code.format_vo";
export type { TTotpCode, TTotpCodeFormatted } from "./type-fields/totp-code.format_vo";
export { FTotpSecret } from "./type-fields/totp-secret.format_vo";
export type { TTotpSecret, TTotpSecretFormatted } from "./type-fields/totp-secret.format_vo";
export { FBusinessName } from "./type-fields/business-name.format_vo";
export type { TBusinessName, TBusinessNameFormatted } from "./type-fields/business-name.format_vo";
export { FCertificateThumbprint } from "./type-fields/certificate-thumbprint.format_vo";
export type { TCertificateThumbprint, TCertificateThumbprintFormatted } from "./type-fields/certificate-thumbprint.format_vo";
export { FDocumentId } from "./type-fields/document-id.format_vo";
export type { TDocumentId, TDocumentIdFormatted } from "./type-fields/document-id.format_vo";
export { FFloat } from "./type-fields/float.format_vo";
export type { TFloat, TFloatFormatted } from "./type-fields/float.format_vo";
export { FIdempotencyKey } from "./type-fields/idempotency-key.format_vo";
export type { TIdempotencyKey, TIdempotencyKeyFormatted } from "./type-fields/idempotency-key.format_vo";
export { FReconciliationId } from "./type-fields/reconciliation-id.format_vo";
export type { TReconciliationId, TReconciliationIdFormatted } from "./type-fields/reconciliation-id.format_vo";

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
export type { TQueueName } from "./domain-models/domain-event.base";
export type { IRepositoryBase, IRepositoryOptions } from "./domain-models/base-repository.interface";
export { DomainEventDispatcher } from "./domain-models/domain-event-dispatcher";
export type { DomainEventHandler, IDispatchOptions, IDispatchResult } from "./domain-models/domain-event-dispatcher";

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
export { Saga, SagaContext } from "./application/saga";
export type { ISagaStep, ISagaContext } from "./application/saga";
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
export { ToolObjectTransform } from "./tools/object-transform.tool";

