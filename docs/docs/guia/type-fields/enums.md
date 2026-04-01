---
title: Enums
sidebar_position: 12
---

# Type Fields — Enums

Type Fields baseados em enums (`const` objects) para valores controlados e finitos. Cada enum TypeField exporta um objeto `O[Nome]` com os valores válidos, e valida contra esse enum automaticamente.

## Resumo

| Classe | Enum | Valores | Arquivo |
|--------|------|---------|---------|
| `FPersonType` | `OPersonType` | `INDIVIDUAL`, `LEGAL_ENTITY` | `person-type.typefield.ts` |
| `FGender` | `OGender` | `MALE`, `FEMALE`, `OTHER`, `NOT_INFORMED` | `gender.typefield.ts` |
| `FMaritalStatus` | `OMaritalStatus` | `SINGLE`, `MARRIED`, `DIVORCED`, `WIDOWED`, `COMMON_LAW` | `marital-status.typefield.ts` |
| `FTransactionStatus` | `OTransactionStatus` | `SUCCESS`, `PENDING`, `FAILED`, `CANCELED`, `PROCESSING` | `transaction-status.typefield.ts` |
| `FAppStatus` | `OAppStatus` | `ACTIVE` (`"active"`), `INACTIVE` (`"inactive"`) | `app-status.typefield.ts` |
| `FHttpStatus` | `OHttpStatus` | Códigos HTTP (200, 201, 400, 404, 500...) | `http-status.typefield.ts` |
| `FStateCode` | — | 2 letras maiúsculas; locale `br`: UFs válidas | `state-code.typefield.ts` |
| `FBoolInt` | `OBoolInt` | `0` (INVALIDO), `1` (VALIDO) | `bool-int.typefield.ts` |

---

## Padrão O\{Nome\}

Todos os enum TypeFields seguem o mesmo padrão: um objeto `const` (prefixo `O`) define os valores válidos, e o TypeField valida contra ele.

```typescript
// 1. Objeto const com os valores válidos
export const OPersonType = {
  INDIVIDUAL: "INDIVIDUAL",
  LEGAL_ENTITY: "LEGAL_ENTITY",
} as const;

// 2. Tipos derivados automaticamente
export type TKeyPersonType = keyof typeof OPersonType;
// "INDIVIDUAL" | "LEGAL_ENTITY"

export type TPersonType = (typeof OPersonType)[TKeyPersonType];
// "INDIVIDUAL" | "LEGAL_ENTITY"

// 3. TypeField valida contra o enum
const result = FPersonType.create(OPersonType.INDIVIDUAL);
```

### Usando em schemas

```typescript
import { FPersonType, FGender, FTransactionStatus, ISchema } from "tyforge";

const schema = {
  personType: { type: FPersonType },
  gender: { type: FGender },
  status: { type: FTransactionStatus },
} satisfies ISchema;
```

---

## FPersonType

Tipo de pessoa: física (individual) ou jurídica (legal entity).

```typescript
import { FPersonType, OPersonType } from "tyforge";

const result = FPersonType.create(OPersonType.INDIVIDUAL);
// Result<FPersonType, ExceptionValidation>

const tipo = FPersonType.createOrThrow("LEGAL_ENTITY");
tipo.getValue(); // "LEGAL_ENTITY"
```

### Constante `OPersonType`

```typescript
export const OPersonType = {
  INDIVIDUAL: "INDIVIDUAL",
  LEGAL_ENTITY: "LEGAL_ENTITY",
} as const;
```

**Regras de validação:**
- Aceita apenas `"INDIVIDUAL"` ou `"LEGAL_ENTITY"`

---

## FGender

Identidade de gênero.

```typescript
import { FGender, OGender } from "tyforge";

const result = FGender.create(OGender.MALE);
// Result<FGender, ExceptionValidation>

const genero = FGender.createOrThrow("NOT_INFORMED");
genero.getValue(); // "NOT_INFORMED"
```

### Constante `OGender`

```typescript
export const OGender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
  NOT_INFORMED: "NOT_INFORMED",
} as const;
```

**Regras de validação:**
- Aceita apenas `"MALE"`, `"FEMALE"`, `"OTHER"` ou `"NOT_INFORMED"`

---

## FMaritalStatus

Estado civil.

```typescript
import { FMaritalStatus, OMaritalStatus } from "tyforge";

const result = FMaritalStatus.create(OMaritalStatus.SINGLE);
// Result<FMaritalStatus, ExceptionValidation>

const estado = FMaritalStatus.createOrThrow("MARRIED");
estado.getValue(); // "MARRIED"
```

### Constante `OMaritalStatus`

```typescript
export const OMaritalStatus = {
  SINGLE: "SINGLE",
  MARRIED: "MARRIED",
  DIVORCED: "DIVORCED",
  WIDOWED: "WIDOWED",
  COMMON_LAW: "COMMON_LAW",
} as const;
```

**Regras de validação:**
- Aceita apenas `"SINGLE"`, `"MARRIED"`, `"DIVORCED"`, `"WIDOWED"` ou `"COMMON_LAW"`

---

## FTransactionStatus

Status de processamento de transação financeira.

```typescript
import { FTransactionStatus, OTransactionStatus } from "tyforge";

const result = FTransactionStatus.create(OTransactionStatus.PENDING);
// Result<FTransactionStatus, ExceptionValidation>

const status = FTransactionStatus.createOrThrow("SUCCESS");
status.getValue(); // "SUCCESS"
```

### Constante `OTransactionStatus`

```typescript
export const OTransactionStatus = {
  SUCCESS: "SUCCESS",
  PENDING: "PENDING",
  FAILED: "FAILED",
  CANCELED: "CANCELED",
  PROCESSING: "PROCESSING",
} as const;
```

**Regras de validação:**
- Aceita apenas `"SUCCESS"`, `"PENDING"`, `"FAILED"`, `"CANCELED"` ou `"PROCESSING"`

---

## FAppStatus

Status de uma aplicação no sistema. Os valores são em lowercase (`"active"`, `"inactive"`).

```typescript
import { FAppStatus, OAppStatus } from "tyforge";

const result = FAppStatus.create(OAppStatus.ACTIVE);
// Result<FAppStatus, ExceptionValidation>

const status = FAppStatus.createOrThrow("active");
status.getValue(); // "active"
status.isActive(); // true
```

### Criação a partir de booleano

```typescript
import { FAppStatus } from "tyforge";

const ativo = FAppStatus.fromBoolean(true);
ativo.getValue(); // "active"

const inativo = FAppStatus.fromBoolean(false);
inativo.getValue(); // "inactive"
```

### Geração de status padrão

```typescript
import { FAppStatus } from "tyforge";

const padrao = FAppStatus.generate();
padrao.getValue(); // "active"
```

### Constante `OAppStatus`

```typescript
export const OAppStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;
```

**Métodos estáticos:**
- `fromBoolean(isActive)` — converte booleano para status
- `generate()` — cria instância com status `"active"`

**Métodos de instância:**
- `isActive()` — retorna `true` se o status for `"active"`

**Regras de validação:**
- Aceita apenas `"active"` ou `"inactive"`

---

## FHttpStatus

Código de status HTTP conforme especificação RFC 7231. O tipo primitivo é `number`.

```typescript
import { FHttpStatus, OHttpStatus } from "tyforge";

const result = FHttpStatus.create(OHttpStatus.OK);
// Result<FHttpStatus, ExceptionValidation>

const status = FHttpStatus.createOrThrow(200);
status.getValue(); // 200
```

### Constante `OHttpStatus`

```typescript
export const OHttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;
```

**Regras de validação:**
- Aceita apenas os valores numéricos do enum `OHttpStatus`
- Nunca use magic numbers — sempre use `OHttpStatus.OK` em vez de `200`

---

## FStateCode

Código de estado ou província (2 letras maiúsculas). Com locale `"br"`, valida contra as UFs brasileiras.

```typescript
import { FStateCode } from "tyforge";

const result = FStateCode.create("SP");
// Result<FStateCode, ExceptionValidation>

const uf = FStateCode.createOrThrow("SP");
uf.getValue(); // "SP"
```

### Com locale brasileiro

```typescript
import { FStateCode, TypeField } from "tyforge";

TypeField.configure({ localeRegion: "br" });

// Aceita UFs válidas
const sp = FStateCode.createOrThrow("SP");
const rj = FStateCode.createOrThrow("RJ");

// Rejeita códigos inválidos
const invalido = FStateCode.create("XX");
// Result com erro: "Invalid Brazilian state code: XX"
```

**UFs válidas (locale `br`):** AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO.

**Regras de validação:**
- Exatamente 2 letras maiúsculas (`/^[A-Z]{2}$/`)
- Locale `br`: valida contra a lista de UFs brasileiras

---

## FBoolInt

Valor booleano codificado como inteiro (`0` ou `1`). Útil para integração com bancos de dados e APIs que representam booleanos como inteiros.

```typescript
import { FBoolInt, OBoolInt } from "tyforge";

const result = FBoolInt.create(OBoolInt.VALIDO);
// Result<FBoolInt, ExceptionValidation>

const flag = FBoolInt.createOrThrow(1);
flag.getValue(); // 1

const invalido = FBoolInt.createOrThrow(OBoolInt.INVALIDO);
invalido.getValue(); // 0
```

### Constante `OBoolInt`

```typescript
export const OBoolInt = {
  INVALIDO: 0,
  VALIDO: 1,
} as const;
```

**Regras de validação:**
- Aceita apenas `0` (INVALIDO) ou `1` (VALIDO)
- Qualquer outro valor numérico é rejeitado
