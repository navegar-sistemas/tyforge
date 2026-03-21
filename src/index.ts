// ── Result Pattern ──────────────────────────────────────────────
export type { Result, ResultPromise } from "./result/result";
export { ok, err, isSuccess, isFailure, map, flatMap, fold, match, getOrElse, orElse, all, OK_TRUE } from "./result/result";

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
export { FNomeCompleto } from "./type-fields/nome-completo.format_vo";
export { FDescricao } from "./type-fields/descricao.format_vo";
export { FApiKey } from "./type-fields/api-key.format_vo";
export { FBearer } from "./type-fields/bearer.format_vo";
export { FSignature } from "./type-fields/signature.format_vo";
export { FTraceId } from "./type-fields/trace-id.format_vo";
export { FPublicKeyPem } from "./type-fields/public-key-pem.format_vo";
export { FHttpStatus } from "./type-fields/http-status.format_vo";
export { FBoolInt } from "./type-fields/bool-int.format_vo";
export { FStatusAplicacao } from "./type-fields/status-aplicacao.format_vo";

// ── Domain Models ───────────────────────────────────────────────
export { Aggregate } from "./domain-models/agreggate.base";
export { Entity } from "./domain-models/entity.base";
export type { IEntityPropsBase } from "./domain-models/entity.base";
export { ValueObject } from "./domain-models/value-object.base";
export { Dto } from "./domain-models/dto.base";
export type { TDtoPropsBase, TDtoPropsJson } from "./domain-models/dto.base";
export { DomainEvent } from "./domain-models/domain-event.base";

// ── Tools ───────────────────────────────────────────────────────
export { TypeGuard } from "./tools/type_guard";
export { ToolParse } from "./tools/parse/parse.tool";
export { ToolFormattingDateISO8601 } from "./tools/formatting/date/date-formatting.tool";

// ── Constants ───────────────────────────────────────────────────
export { OHttpStatus, type THttpStatus } from "./constants/http-status.constants";
