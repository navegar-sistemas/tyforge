import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ITypeFieldConfig } from "@tyforge/type-fields/type-field.config";
import { Result, ok, err, isFailure, OK_TRUE } from "@tyforge/result";
import { ExceptionValidation } from "@tyforge/exceptions/validation.exception";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { v7 as uuidv7 } from "uuid";

/**
 * FTraceId - Identificador de Rastreamento Distribuído (UUID v7)
 *
 * PROPÓSITO:
 * ==========
 * Identificador único para rastreamento distribuído em sistemas de microserviços.
 * Cada requisição recebe um trace ID que é propagado através de todos os serviços,
 * permitindo correlacionar logs, métricas e debug de ponta a ponta.
 *
 * DIFERENÇA ENTRE FId e FTraceId:
 * ===============================
 * - FId: Identificador de entidade/agregado (pode mudar de formato no futuro)
 * - FTraceId: Identificador de requisição (SEMPRE UUID v7 para ordenação temporal)
 *
 * GARANTIAS DE UNICIDADE (uuid@11.x):
 * ===================================
 * A biblioteca uuid implementa UUID v7 com:
 * 1. Timestamp de 48 bits (ms) - ordenável até ano 10889
 * 2. Contador monotônico interno - garante unicidade no mesmo ms
 * 3. 62 bits de entropia criptográfica - impossível colidir entre processos
 *
 * ESTRUTURA UUID v7 (RFC 9562 - 128 bits):
 * ========================================
 *
 *   0                   1                   2                   3
 *   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                         unix_ts_ms (32 bits)                  |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |          unix_ts_ms (16 bits) |  ver  |    rand_a (12 bits)   |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |var|                    rand_b (62 bits)                       |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *  |                         rand_b (continued)                    |
 *  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 *
 * - unix_ts_ms (48 bits): Timestamp Unix em milissegundos
 * - ver (4 bits): Versão 7 (0111 binário)
 * - rand_a (12 bits): Sub-millisecond precision ou contador monotônico
 * - var (2 bits): Variante RFC 4122 (10 binário)
 * - rand_b (62 bits): Bytes criptograficamente seguros
 *
 * ANÁLISE MATEMÁTICA DE COLISÃO:
 * ==============================
 * Probabilidade de colisão entre processos: 1/2^62 = 1/4.6 quintilhões
 * Gerando 1 trilhão IDs/segundo: ~292 mil anos para 50% de chance
 * CONCLUSÃO: Colisão é estatisticamente impossível.
 *
 * EXEMPLO DE USO:
 * ===============
 * ```typescript
 * // Gerar novo trace ID (API Gateway)
 * const traceId = FTraceId.generate();
 *
 * // Validar trace ID recebido (Microserviço)
 * const result = FTraceId.create(payload.headers['x-trace-id']);
 * if (isFailure(result)) {
 *   return err(result.error);
 * }
 *
 * // Extrair timestamp do trace ID (debug)
 * const timestamp = traceId.getTimestamp();
 * // → Date object
 * ```
 */

export type TTraceId = string;
export type TTraceIdFormatted = string;

interface IParsedTraceId {
  timestamp: Date;
  version: number;
  variant: number;
}

const UUID_V7_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class FTraceId extends TypeField<TTraceId, TTraceIdFormatted> {
  override readonly typeInference = "FTraceId";

  override readonly config: ITypeFieldConfig<TTraceId> = {
    jsonSchemaType: "string",
    minLength: 36,
    maxLength: 36,
    serializeAsString: false,
  };

  private constructor(value: TTraceId, fieldPath: string) {
    super(value, fieldPath);
  }

  static validateRaw(
    value: unknown,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    const parsed = typeof value === "string" ? value.trim() : String(value);

    const base = TypeGuard.isString(parsed, fieldPath, 36, 36);
    if (!base.success) return base;

    if (!UUID_V7_PATTERN.test(parsed)) {
      return err(
        ExceptionValidation.create(
          fieldPath,
          "TraceId deve ser UUID v7 valido (versao 7, variante RFC 4122)",
        ),
      );
    }

    return OK_TRUE;
  }

  static create(
    raw: TTraceId,
    fieldPath = "TraceId",
  ): Result<FTraceId, ExceptionValidation> {
    const parsedValue = typeof raw === "string" ? raw.trim() : String(raw);

    const validation = FTraceId.validateRaw(parsedValue, fieldPath);
    if (!validation.success) return err(validation.error);
    return ok(new FTraceId(parsedValue, fieldPath));
  }

  static createOrThrow(raw: TTraceId, fieldPath = "TraceId"): FTraceId {
    const result = this.create(raw, fieldPath);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  /**
   * Gera um novo trace ID usando UUID v7.
   * Deve ser usado APENAS no API Gateway para gerar o ID inicial.
   */
  static generate(): FTraceId {
    const uuid = uuidv7();
    return FTraceId.createOrThrow(uuid, "TraceId");
  }

  /**
   * Gera um novo trace ID e retorna apenas a string.
   * Útil quando não precisa do wrapper FTraceId.
   */
  static generateString(): string {
    return uuidv7();
  }

  /**
   * Retorna o padrão regex para validação externa.
   * Útil para schemas de validação (Zod, Joi, etc).
   */
  static getPattern(): RegExp {
    return UUID_V7_PATTERN;
  }

  /**
   * Valida se uma string é um trace ID válido (UUID v7).
   */
  static isValid(value: string): boolean {
    return UUID_V7_PATTERN.test(value);
  }

  override validate(
    value: TTraceId,
    fieldPath: string,
  ): Result<true, ExceptionValidation> {
    return FTraceId.validateRaw(value, fieldPath);
  }

  /**
   * Extrai o timestamp de quando o trace ID foi gerado.
   * Útil para debug e análise de latência.
   */
  getTimestamp(): Date {
    const parsed = this.parse();
    return parsed?.timestamp ?? new Date(0);
  }

  /**
   * Extrai informações detalhadas do UUID v7.
   */
  parse(): IParsedTraceId | null {
    const hex = this._value.replace(/-/g, "");
    const bytes = new Uint8Array(16);

    for (let i = 0; i < 16; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }

    const timestamp = Number(
      (BigInt(bytes[0]) << 40n) |
        (BigInt(bytes[1]) << 32n) |
        (BigInt(bytes[2]) << 24n) |
        (BigInt(bytes[3]) << 16n) |
        (BigInt(bytes[4]) << 8n) |
        BigInt(bytes[5]),
    );

    const version = (bytes[6] >> 4) & 0x0f;
    const variant = (bytes[8] >> 6) & 0x03;

    return {
      timestamp: new Date(timestamp),
      version,
      variant,
    };
  }

  override toString(): string {
    return String(this.getValue());
  }

  override formatted(): string {
    return String(this.getValue());
  }

  override getDescription(): string {
    return "Identificador único de rastreamento distribuído no formato UUID v7 (RFC 9562). Usado para correlacionar logs, métricas e debug entre microserviços. Contém timestamp embutido para ordenação temporal.";
  }

  override getShortDescription(): string {
    return "Trace ID (UUID v7)";
  }
}
