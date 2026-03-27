---
title: Identificadores
sidebar_position: 5
---

# Type Fields — Identificadores

Type Fields de identificação encapsulam UUIDs, tokens de autenticação e assinaturas digitais com validação rigorosa de formato.

## Resumo

| Classe | Tipo | Comprimento | Validação extra | Arquivo |
|--------|------|-------------|-----------------|---------|
| `FId` | UUID (qualquer versão) | 36 | Regex UUID | `id.format_vo.ts` |
| `FIdReq` | String livre | 1–36 | — | `id-req.format_vo.ts` |
| `FTraceId` | UUID v7 | 36 | Regex UUID v7 (RFC 9562) | `trace-id.format_vo.ts` |
| `FApiKey` | UUID v4 | 36 | `uuid.validate()` + versão 4 | `api-key.format_vo.ts` |
| `FBearer` | Token JWT | 100–5000 | Prefixo `"Bearer "` | `bearer.format_vo.ts` |
| `FSignature` | Base64 | 64–512 | Regex base64 | `signature.format_vo.ts` |
| `FIdentifier` | Classe base abstrata | — | `validateType` + `generateId` | `identifier.format_vo.ts` |
| `FTransactionId` | UUID | 36 | `uuid.validate()` | `transaction-id.format_vo.ts` |
| `FDeviceId` | UUID | 36 | `uuid.validate()` | `device-id.format_vo.ts` |
| `FCorrelationId` | UUID | 36 | `uuid.validate()` | `correlation-id.format_vo.ts` |
| `FReconciliationId` | Alfanumérico | 1–35 | Regex `^[a-zA-Z0-9]+$` | `reconciliation-id.format_vo.ts` |
| `FIdempotencyKey` | Alfanumérico + hifens | 32–36 | Regex `^[a-zA-Z0-9\-]+$` | `idempotency-key.format_vo.ts` |
| `FCertificateThumbprint` | Hexadecimal | 40 ou 64 | Regex hex + comprimento exato | `certificate-thumbprint.format_vo.ts` |
| `FBankNsu` | Alfanumérico | 1–20 | Regex `^[a-zA-Z0-9]+$` | `bank-nsu.format_vo.ts` |

---

## FId

Identificador único universal (UUID). Utilizado como chave primária de entidades e agregados. Gera UUIDs v7 (ordenados temporalmente) via método `generate()`.

```typescript
import { FId } from "tyforge";

// Criar a partir de string UUID existente
const result = FId.create("0193a5e7-8b3c-7d4e-9f1a-2b3c4d5e6f7a");
// Result<FId, ExceptionValidation>

// Gerar novo UUID v7
const novoId = FId.generate();
novoId.getValue(); // "0193a5e7-8b3c-7d4e-9f1a-2b3c4d5e6f7a"

// Gerar apenas a string UUID (sem wrapper)
const uuidStr = FId.generateId();
// "0193a5e7-..."
```

**Métodos estáticos:**
- `create(raw, fieldPath?)` — valida e cria instância
- `createOrThrow(raw, fieldPath?)` — lança exceção se inválido
- `generate()` — gera nova instância com UUID v7
- `generateId()` — retorna string UUID v7 sem wrapper

---

## FIdReq

Identificador de requisição. Aceita qualquer string de 1 a 36 caracteres, sem restrição de formato UUID. Utilizado para rastrear requisições externas e garantir idempotência.

```typescript
import { FIdReq } from "tyforge";

const result = FIdReq.create("req-abc-123");
// Result<FIdReq, ExceptionValidation>

const id = FIdReq.createOrThrow("meu-id-externo");
id.getValue();  // "meu-id-externo"
id.formatted(); // "meu-id-externo" (com trim)
```

---

## FTraceId

Identificador de rastreamento distribuído no formato UUID v7 (RFC 9562). Contém timestamp embutido para ordenação temporal. Ideal para correlacionar logs e métricas entre microsserviços.

```typescript
import { FTraceId } from "tyforge";

// Gerar novo trace ID (no API Gateway)
const traceId = FTraceId.generate();
traceId.getValue(); // "0193a5e7-8b3c-7d4e-9f1a-2b3c4d5e6f7a"

// Validar trace ID recebido (no microsserviço)
const result = FTraceId.create(headers["x-trace-id"]);

// Extrair timestamp do trace ID
const timestamp = traceId.getTimestamp();
// Date object com o momento da geração

// Verificar validade sem criar instância
const valido = FTraceId.isValid("0193a5e7-8b3c-7d4e-9f1a-2b3c4d5e6f7a");
// true
```

**Métodos estáticos:**
- `generate()` — gera nova instância com UUID v7
- `generateString()` — retorna string UUID v7 sem wrapper
- `isValid(value)` — verifica se é UUID v7 válido
- `getPattern()` — retorna regex para validação externa

**Métodos de instância:**
- `getTimestamp()` — extrai o `Date` embutido no UUID v7
- `parse()` — retorna `{ timestamp, version, variant }` do UUID

**Diferença entre `FId` e `FTraceId`:**
- `FId` — identificador de entidade/agregado (aceita qualquer versão UUID)
- `FTraceId` — identificador de requisição (obrigatoriamente UUID v7 para ordenação temporal)

---

## FApiKey

Chave de API no formato UUID v4 para autenticação de aplicações cliente.

```typescript
import { FApiKey } from "tyforge";

// Gerar nova API key
const apiKey = FApiKey.generate();
apiKey.getValue(); // "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"

// Exibir de forma segura (mascarado)
apiKey.toSafeDisplay();
// "a1b2c3d4-****-****-****-0e1f2a3b4c5d"

// Verificar validade
FApiKey.isValid("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"); // true
```

**Métodos estáticos:**
- `generate()` — gera nova instância com UUID v4
- `generateString()` — retorna string UUID v4 sem wrapper
- `isValid(value)` — verifica se é UUID v4 válido

**Métodos de instância:**
- `toSafeDisplay()` — retorna a chave mascarada, exibindo apenas o primeiro e último segmento

---

## FBearer

Token de acesso Bearer para autenticação em APIs. Deve começar com o prefixo `"Bearer "` e ter entre 100 e 5000 caracteres.

```typescript
import { FBearer } from "tyforge";

const token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const result = FBearer.create(token);
// Result<FBearer, ExceptionValidation>

const bearer = FBearer.createOrThrow(token);
bearer.formatted(); // Garante prefixo "Bearer "
```

**Regras de validação:**
- Comprimento entre 100 e 5000 caracteres
- Deve começar com `"Bearer "` (com espaço)
- Conteúdo após o prefixo deve ser não-vazio

---

## FSignature

Assinatura digital no formato base64. Utilizada para verificação de autenticidade e integridade de dados.

```typescript
import { FSignature } from "tyforge";

const sig = "dGVzdGUgZGUgYXNzaW5hdHVyYSBkaWdpdGFsIGJhc2U2NC4uLg==...";
const result = FSignature.create(sig);
// Result<FSignature, ExceptionValidation>

const assinatura = FSignature.createOrThrow(sig);
assinatura.formatted(); // Valor com trim
```

**Regras de validação:**
- Comprimento entre 64 e 512 caracteres
- Deve ser uma string base64 válida (`/^[A-Za-z0-9+/]+=*$/`)
- Conteúdo limpo (sem espaços) deve ter no mínimo 64 caracteres

---

## FIdentifier

Classe base abstrata para todos os TypeFields de identificação. Não impõe formato específico — as subclasses definem suas próprias regras de validação (UUID, alfanumérico, hexadecimal, etc). Fornece `validateType()` para narrowing de tipo e `generateId()` para geração de UUIDs v7.

```typescript
import { FIdentifier } from "tyforge";

// FIdentifier é abstrata — não pode ser instanciada diretamente.
// Use as subclasses concretas (FTransactionId, FDeviceId, etc).

// Gerar um UUID v7 (disponível em todas as subclasses)
const uuid = FIdentifier.generateId();
// "0193a5e7-8b3c-7d4e-9f1a-2b3c4d5e6f7a"
```

**Métodos estáticos:**
- `validateType(value, fieldPath)` — valida que o valor é uma string
- `generateId()` — retorna string UUID v7 sem wrapper

---

## FTransactionId

Identificador único de transação no formato UUID. Utilizado para rastrear transações financeiras, pedidos e operações de negócio.

```typescript
import { FTransactionId } from "tyforge";

// Criar a partir de UUID existente
const result = FTransactionId.create("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
// Result<FTransactionId, ExceptionValidation>

// Gerar novo UUID
const txId = FTransactionId.generate();
txId.getValue(); // "0193a5e7-8b3c-7d4e-9f1a-2b3c4d5e6f7a"

const id = FTransactionId.createOrThrow("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
id.getValue(); // "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
```

**Métodos estáticos:**
- `create(raw, fieldPath?)` — valida e cria instância
- `createOrThrow(raw, fieldPath?)` — lança exceção se inválido
- `assign(value, fieldPath?)` — hidratação do banco
- `generate(fieldPath?)` — gera nova instância com UUID v7

**Regras de validação:**
- Comprimento exato de 36 caracteres
- Deve ser um UUID válido (`uuid.validate()`)

---

## FDeviceId

Identificador de dispositivo no formato UUID. Utilizado para registrar e rastrear dispositivos em sistemas IoT, mobile ou de pagamento.

```typescript
import { FDeviceId } from "tyforge";

// Gerar novo device ID
const deviceId = FDeviceId.generate();
deviceId.getValue(); // "0193a5e7-8b3c-7d4e-9f1a-2b3c4d5e6f7a"

// Validar device ID recebido
const result = FDeviceId.create("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
// Result<FDeviceId, ExceptionValidation>
```

**Métodos estáticos:**
- `create(raw, fieldPath?)` — valida e cria instância
- `createOrThrow(raw, fieldPath?)` — lança exceção se inválido
- `assign(value, fieldPath?)` — hidratação do banco
- `generate(fieldPath?)` — gera nova instância com UUID v7

**Regras de validação:**
- Comprimento exato de 36 caracteres
- Deve ser um UUID válido (`uuid.validate()`)

---

## FCorrelationId

Identificador de correlação no formato UUID para rastreamento de requisições entre sistemas distribuídos. Permite vincular logs, eventos e métricas de diferentes microsserviços a uma mesma operação.

```typescript
import { FCorrelationId } from "tyforge";

// Gerar novo correlation ID (no ponto de entrada)
const correlationId = FCorrelationId.generate();
correlationId.getValue(); // "0193a5e7-8b3c-7d4e-9f1a-2b3c4d5e6f7a"

// Validar correlation ID recebido (nos microsserviços)
const result = FCorrelationId.create(headers["x-correlation-id"]);
// Result<FCorrelationId, ExceptionValidation>
```

**Métodos estáticos:**
- `create(raw, fieldPath?)` — valida e cria instância
- `createOrThrow(raw, fieldPath?)` — lança exceção se inválido
- `assign(value, fieldPath?)` — hidratação do banco
- `generate(fieldPath?)` — gera nova instância com UUID v7

**Regras de validação:**
- Comprimento exato de 36 caracteres
- Deve ser um UUID válido (`uuid.validate()`)

---

## FReconciliationId

Identificador de conciliação para correspondência de pagamentos e transações financeiras. Aceita strings alfanuméricas de até 35 caracteres, compatível com padrões bancários e de adquirentes.

```typescript
import { FReconciliationId } from "tyforge";

const result = FReconciliationId.create("REC20240315ABC123");
// Result<FReconciliationId, ExceptionValidation>

const id = FReconciliationId.createOrThrow("TXN987654321");
id.getValue(); // "TXN987654321"
```

**Regras de validação:**
- Comprimento entre 1 e 35 caracteres
- Deve conter apenas caracteres alfanuméricos (`/^[a-zA-Z0-9]+$/`)

---

## FIdempotencyKey

Chave de idempotência para prevenir operações duplicadas. Aceita strings alfanuméricas com hifens, tipicamente UUIDs ou hashes. Essencial para garantir que retentativas de requisição não causem efeitos colaterais duplicados.

```typescript
import { FIdempotencyKey } from "tyforge";

const result = FIdempotencyKey.create("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
// Result<FIdempotencyKey, ExceptionValidation>

const key = FIdempotencyKey.createOrThrow("550e8400e29b41d4a716446655440000");
key.getValue(); // "550e8400e29b41d4a716446655440000"
```

**Regras de validação:**
- Comprimento entre 32 e 36 caracteres
- Deve conter apenas caracteres alfanuméricos e hifens (`/^[a-zA-Z0-9\-]+$/`)

---

## FCertificateThumbprint

Thumbprint (impressão digital) de certificado digital em formato hexadecimal. Suporta SHA-1 (40 caracteres) e SHA-256 (64 caracteres). Utilizado para identificar certificados em integração com APIs de pagamento, assinatura digital e mTLS.

```typescript
import { FCertificateThumbprint } from "tyforge";

// SHA-1 (40 caracteres)
const sha1 = FCertificateThumbprint.create("a94a8fe5ccb19ba61c4c0873d391e987982fbbd3");
// Result<FCertificateThumbprint, ExceptionValidation>

// SHA-256 (64 caracteres)
const sha256 = FCertificateThumbprint.createOrThrow(
  "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
);
sha256.getValue(); // "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
```

**Regras de validação:**
- Deve conter apenas caracteres hexadecimais (`/^[0-9A-Fa-f]+$/`)
- Comprimento deve ser exatamente 40 (SHA-1) ou 64 (SHA-256) caracteres

---

## FBankNsu

NSU (Número Sequencial Único) bancário — identificador alfanumérico de comprovante ou transação emitido pela adquirente ou processador de pagamento.

```typescript
import { FBankNsu } from "tyforge";

const result = FBankNsu.create("123456789012");
// Result<FBankNsu, ExceptionValidation>

const nsu = FBankNsu.createOrThrow("NSU20240315001");
nsu.getValue(); // "NSU20240315001"
```

**Regras de validação:**
- Comprimento entre 1 e 20 caracteres
- Deve conter apenas caracteres alfanuméricos (`/^[a-zA-Z0-9]+$/`)
