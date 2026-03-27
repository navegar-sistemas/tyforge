---
title: Identificadores
sidebar_position: 5
---

# Type Fields — Identificadores

Type Fields de identificacao encapsulam UUIDs, tokens de autenticacao e assinaturas digitais com validacao rigorosa de formato.

## Resumo

| Classe | Tipo | Comprimento | Validacao extra | Arquivo |
|--------|------|-------------|-----------------|---------|
| `FId` | UUID (qualquer versao) | 36 | Regex UUID | `id.format_vo.ts` |
| `FIdReq` | String livre | 1–36 | — | `id-req.format_vo.ts` |
| `FTraceId` | UUID v7 | 36 | Regex UUID v7 (RFC 9562) | `trace-id.format_vo.ts` |
| `FApiKey` | UUID v4 | 36 | `uuid.validate()` + versao 4 | `api-key.format_vo.ts` |
| `FBearer` | Token JWT | 100–5000 | Prefixo `"Bearer "` | `bearer.format_vo.ts` |
| `FSignature` | Base64 | 64–512 | Regex base64 | `signature.format_vo.ts` |
| `FIdentifier` | Classe base abstrata | — | `validateType` + `generateId` | `identifier.format_vo.ts` |
| `FTransactionId` | UUID | 36 | `uuid.validate()` | `transaction-id.format_vo.ts` |
| `FDeviceId` | UUID | 36 | `uuid.validate()` | `device-id.format_vo.ts` |
| `FCorrelationId` | UUID | 36 | `uuid.validate()` | `correlation-id.format_vo.ts` |
| `FReconciliationId` | Alfanumerico | 1–35 | Regex `^[a-zA-Z0-9]+$` | `reconciliation-id.format_vo.ts` |
| `FIdempotencyKey` | Alfanumerico + hifens | 32–36 | Regex `^[a-zA-Z0-9\-]+$` | `idempotency-key.format_vo.ts` |
| `FCertificateThumbprint` | Hexadecimal | 40 ou 64 | Regex hex + comprimento exato | `certificate-thumbprint.format_vo.ts` |
| `FBankNsu` | Alfanumerico | 1–20 | Regex `^[a-zA-Z0-9]+$` | `bank-nsu.format_vo.ts` |

---

## FId

Identificador unico universal (UUID). Utilizado como chave primaria de entidades e agregados. Gera UUIDs v7 (ordenados temporalmente) via metodo `generate()`.

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

**Metodos estaticos:**
- `create(raw, fieldPath?)` — valida e cria instancia
- `createOrThrow(raw, fieldPath?)` — lanca excecao se invalido
- `generate()` — gera nova instancia com UUID v7
- `generateId()` — retorna string UUID v7 sem wrapper

---

## FIdReq

Identificador de requisicao. Aceita qualquer string de 1 a 36 caracteres, sem restricao de formato UUID. Utilizado para rastrear requisicoes externas e garantir idempotencia.

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

Identificador de rastreamento distribuido no formato UUID v7 (RFC 9562). Contém timestamp embutido para ordenacao temporal. Ideal para correlacionar logs e metricas entre microservicos.

```typescript
import { FTraceId } from "tyforge";

// Gerar novo trace ID (no API Gateway)
const traceId = FTraceId.generate();
traceId.getValue(); // "0193a5e7-8b3c-7d4e-9f1a-2b3c4d5e6f7a"

// Validar trace ID recebido (no microservico)
const result = FTraceId.create(headers["x-trace-id"]);

// Extrair timestamp do trace ID
const timestamp = traceId.getTimestamp();
// Date object com o momento da geracao

// Verificar validade sem criar instancia
const valido = FTraceId.isValid("0193a5e7-8b3c-7d4e-9f1a-2b3c4d5e6f7a");
// true
```

**Metodos estaticos:**
- `generate()` — gera nova instancia com UUID v7
- `generateString()` — retorna string UUID v7 sem wrapper
- `isValid(value)` — verifica se e UUID v7 valido
- `getPattern()` — retorna regex para validacao externa

**Metodos de instancia:**
- `getTimestamp()` — extrai o `Date` embutido no UUID v7
- `parse()` — retorna `{ timestamp, version, variant }` do UUID

**Diferenca entre `FId` e `FTraceId`:**
- `FId` — identificador de entidade/agregado (aceita qualquer versao UUID)
- `FTraceId` — identificador de requisicao (obrigatoriamente UUID v7 para ordenacao temporal)

---

## FApiKey

Chave de API no formato UUID v4 para autenticacao de aplicacoes cliente.

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

**Metodos estaticos:**
- `generate()` — gera nova instancia com UUID v4
- `generateString()` — retorna string UUID v4 sem wrapper
- `isValid(value)` — verifica se e UUID v4 valido

**Metodos de instancia:**
- `toSafeDisplay()` — retorna a chave mascarada, exibindo apenas o primeiro e ultimo segmento

---

## FBearer

Token de acesso Bearer para autenticacao em APIs. Deve comecar com o prefixo `"Bearer "` e ter entre 100 e 5000 caracteres.

```typescript
import { FBearer } from "tyforge";

const token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const result = FBearer.create(token);
// Result<FBearer, ExceptionValidation>

const bearer = FBearer.createOrThrow(token);
bearer.formatted(); // Garante prefixo "Bearer "
```

**Regras de validacao:**
- Comprimento entre 100 e 5000 caracteres
- Deve comecar com `"Bearer "` (com espaco)
- Conteudo apos o prefixo deve ser nao-vazio

---

## FSignature

Assinatura digital no formato base64. Utilizada para verificacao de autenticidade e integridade de dados.

```typescript
import { FSignature } from "tyforge";

const sig = "dGVzdGUgZGUgYXNzaW5hdHVyYSBkaWdpdGFsIGJhc2U2NC4uLg==...";
const result = FSignature.create(sig);
// Result<FSignature, ExceptionValidation>

const assinatura = FSignature.createOrThrow(sig);
assinatura.formatted(); // Valor com trim
```

**Regras de validacao:**
- Comprimento entre 64 e 512 caracteres
- Deve ser uma string base64 valida (`/^[A-Za-z0-9+/]+=*$/`)
- Conteudo limpo (sem espacos) deve ter no minimo 64 caracteres

---

## FIdentifier

Classe base abstrata para todos os TypeFields de identificacao. Nao impoe formato especifico — as subclasses definem suas proprias regras de validacao (UUID, alfanumerico, hexadecimal, etc). Fornece `validateType()` para narrowing de tipo e `generateId()` para geracao de UUIDs v7.

```typescript
import { FIdentifier } from "tyforge";

// FIdentifier e abstrata — nao pode ser instanciada diretamente.
// Use as subclasses concretas (FTransactionId, FDeviceId, etc).

// Gerar um UUID v7 (disponivel em todas as subclasses)
const uuid = FIdentifier.generateId();
// "0193a5e7-8b3c-7d4e-9f1a-2b3c4d5e6f7a"
```

**Metodos estaticos:**
- `validateType(value, fieldPath)` — valida que o valor e uma string
- `generateId()` — retorna string UUID v7 sem wrapper

---

## FTransactionId

Identificador unico de transacao no formato UUID. Utilizado para rastrear transacoes financeiras, pedidos e operacoes de negocio.

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

**Metodos estaticos:**
- `create(raw, fieldPath?)` — valida e cria instancia
- `createOrThrow(raw, fieldPath?)` — lanca excecao se invalido
- `assign(value, fieldPath?)` — hidratacao do banco
- `generate(fieldPath?)` — gera nova instancia com UUID v7

**Regras de validacao:**
- Comprimento exato de 36 caracteres
- Deve ser um UUID valido (`uuid.validate()`)

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

**Metodos estaticos:**
- `create(raw, fieldPath?)` — valida e cria instancia
- `createOrThrow(raw, fieldPath?)` — lanca excecao se invalido
- `assign(value, fieldPath?)` — hidratacao do banco
- `generate(fieldPath?)` — gera nova instancia com UUID v7

**Regras de validacao:**
- Comprimento exato de 36 caracteres
- Deve ser um UUID valido (`uuid.validate()`)

---

## FCorrelationId

Identificador de correlacao no formato UUID para rastreamento de requisicoes entre sistemas distribuidos. Permite vincular logs, eventos e metricas de diferentes microservicos a uma mesma operacao.

```typescript
import { FCorrelationId } from "tyforge";

// Gerar novo correlation ID (no ponto de entrada)
const correlationId = FCorrelationId.generate();
correlationId.getValue(); // "0193a5e7-8b3c-7d4e-9f1a-2b3c4d5e6f7a"

// Validar correlation ID recebido (nos microservicos)
const result = FCorrelationId.create(headers["x-correlation-id"]);
// Result<FCorrelationId, ExceptionValidation>
```

**Metodos estaticos:**
- `create(raw, fieldPath?)` — valida e cria instancia
- `createOrThrow(raw, fieldPath?)` — lanca excecao se invalido
- `assign(value, fieldPath?)` — hidratacao do banco
- `generate(fieldPath?)` — gera nova instancia com UUID v7

**Regras de validacao:**
- Comprimento exato de 36 caracteres
- Deve ser um UUID valido (`uuid.validate()`)

---

## FReconciliationId

Identificador de conciliacao para correspondencia de pagamentos e transacoes financeiras. Aceita strings alfanumericas de ate 35 caracteres, compativel com padroes bancarios e de adquirentes.

```typescript
import { FReconciliationId } from "tyforge";

const result = FReconciliationId.create("REC20240315ABC123");
// Result<FReconciliationId, ExceptionValidation>

const id = FReconciliationId.createOrThrow("TXN987654321");
id.getValue(); // "TXN987654321"
```

**Regras de validacao:**
- Comprimento entre 1 e 35 caracteres
- Deve conter apenas caracteres alfanumericos (`/^[a-zA-Z0-9]+$/`)

---

## FIdempotencyKey

Chave de idempotencia para prevenir operacoes duplicadas. Aceita strings alfanumericas com hifens, tipicamente UUIDs ou hashes. Essencial para garantir que retentativas de requisicao nao causem efeitos colaterais duplicados.

```typescript
import { FIdempotencyKey } from "tyforge";

const result = FIdempotencyKey.create("a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d");
// Result<FIdempotencyKey, ExceptionValidation>

const key = FIdempotencyKey.createOrThrow("550e8400e29b41d4a716446655440000");
key.getValue(); // "550e8400e29b41d4a716446655440000"
```

**Regras de validacao:**
- Comprimento entre 32 e 36 caracteres
- Deve conter apenas caracteres alfanumericos e hifens (`/^[a-zA-Z0-9\-]+$/`)

---

## FCertificateThumbprint

Thumbprint (impressao digital) de certificado digital em formato hexadecimal. Suporta SHA-1 (40 caracteres) e SHA-256 (64 caracteres). Utilizado para identificar certificados em integracao com APIs de pagamento, assinatura digital e mTLS.

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

**Regras de validacao:**
- Deve conter apenas caracteres hexadecimais (`/^[0-9A-Fa-f]+$/`)
- Comprimento deve ser exatamente 40 (SHA-1) ou 64 (SHA-256) caracteres

---

## FBankNsu

NSU (Numero Sequencial Unico) bancario — identificador alfanumerico de comprovante ou transacao emitido pela adquirente ou processador de pagamento.

```typescript
import { FBankNsu } from "tyforge";

const result = FBankNsu.create("123456789012");
// Result<FBankNsu, ExceptionValidation>

const nsu = FBankNsu.createOrThrow("NSU20240315001");
nsu.getValue(); // "NSU20240315001"
```

**Regras de validacao:**
- Comprimento entre 1 e 20 caracteres
- Deve conter apenas caracteres alfanumericos (`/^[a-zA-Z0-9]+$/`)
