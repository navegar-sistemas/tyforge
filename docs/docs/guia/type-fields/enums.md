---
title: Enums
sidebar_position: 12
---

# Type Fields — Enums

Type Fields baseados em enums (`const` objects) para valores controlados e finitos. Cada enum TypeField exporta um objeto `O[Nome]` com os valores validos, e valida contra esse enum automaticamente.

## Resumo

| Classe | Enum | Valores | Arquivo |
|--------|------|---------|---------|
| `FPersonType` | `OPersonType` | `INDIVIDUAL`, `LEGAL_ENTITY` | `person-type.format_vo.ts` |
| `FGender` | `OGender` | `MALE`, `FEMALE`, `OTHER`, `NOT_INFORMED` | `gender.format_vo.ts` |
| `FMaritalStatus` | `OMaritalStatus` | `SINGLE`, `MARRIED`, `DIVORCED`, `WIDOWED`, `COMMON_LAW` | `marital-status.format_vo.ts` |
| `FTransactionStatus` | `OTransactionStatus` | `SUCCESS`, `PENDING`, `FAILED`, `CANCELED`, `PROCESSING` | `transaction-status.format_vo.ts` |
| `FAppStatus` | `OAppStatus` | `ACTIVE` (`"active"`), `INACTIVE` (`"inactive"`) | `app-status.format_vo.ts` |
| `FHttpStatus` | `OHttpStatus` | Codigos HTTP (200, 201, 400, 404, 500...) | `http-status.format_vo.ts` |
| `FStateCode` | — | 2 letras maiusculas; locale `br`: UFs validas | `state-code.format_vo.ts` |
| `FBoolInt` | `OBoolInt` | `0` (INVALIDO), `1` (VALIDO) | `bool-int.format_vo.ts` |

---

## Padrao O\{Nome\}

Todos os enum TypeFields seguem o mesmo padrao: um objeto `const` (prefixo `O`) define os valores validos, e o TypeField valida contra ele.

```typescript
// 1. Objeto const com os valores validos
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

Tipo de pessoa: fisica (individual) ou juridica (legal entity).

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

**Regras de validacao:**
- Aceita apenas `"INDIVIDUAL"` ou `"LEGAL_ENTITY"`

---

## FGender

Identidade de genero.

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

**Regras de validacao:**
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

**Regras de validacao:**
- Aceita apenas `"SINGLE"`, `"MARRIED"`, `"DIVORCED"`, `"WIDOWED"` ou `"COMMON_LAW"`

---

## FTransactionStatus

Status de processamento de transacao financeira.

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

**Regras de validacao:**
- Aceita apenas `"SUCCESS"`, `"PENDING"`, `"FAILED"`, `"CANCELED"` ou `"PROCESSING"`

---

## FAppStatus

Status de uma aplicacao no sistema. Os valores sao em lowercase (`"active"`, `"inactive"`).

```typescript
import { FAppStatus, OAppStatus } from "tyforge";

const result = FAppStatus.create(OAppStatus.ACTIVE);
// Result<FAppStatus, ExceptionValidation>

const status = FAppStatus.createOrThrow("active");
status.getValue(); // "active"
status.isActive(); // true
```

### Criacao a partir de booleano

```typescript
import { FAppStatus } from "tyforge";

const ativo = FAppStatus.fromBoolean(true);
ativo.getValue(); // "active"

const inativo = FAppStatus.fromBoolean(false);
inativo.getValue(); // "inactive"
```

### Geracao de status padrao

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

**Metodos estaticos:**
- `fromBoolean(isActive)` — converte booleano para status
- `generate()` — cria instancia com status `"active"`

**Metodos de instancia:**
- `isActive()` — retorna `true` se o status for `"active"`

**Regras de validacao:**
- Aceita apenas `"active"` ou `"inactive"`

---

## FHttpStatus

Codigo de status HTTP conforme especificacao RFC 7231. O tipo primitivo e `number`.

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

**Regras de validacao:**
- Aceita apenas os valores numericos do enum `OHttpStatus`
- Nunca use magic numbers — sempre use `OHttpStatus.OK` em vez de `200`

---

## FStateCode

Codigo de estado ou provincia (2 letras maiusculas). Com locale `"br"`, valida contra as UFs brasileiras.

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

TypeField.configure({ locale: "br" });

// Aceita UFs validas
const sp = FStateCode.createOrThrow("SP");
const rj = FStateCode.createOrThrow("RJ");

// Rejeita codigos invalidos
const invalido = FStateCode.create("XX");
// Result com erro: "Invalid Brazilian state code: XX"
```

**UFs validas (locale `br`):** AC, AL, AM, AP, BA, CE, DF, ES, GO, MA, MG, MS, MT, PA, PB, PE, PI, PR, RJ, RN, RO, RR, RS, SC, SE, SP, TO.

**Regras de validacao:**
- Exatamente 2 letras maiusculas (`/^[A-Z]{2}$/`)
- Locale `br`: valida contra a lista de UFs brasileiras

---

## FBoolInt

Valor booleano codificado como inteiro (`0` ou `1`). Util para integracao com bancos de dados e APIs que representam booleanos como inteiros.

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

**Regras de validacao:**
- Aceita apenas `0` (INVALIDO) ou `1` (VALIDO)
- Qualquer outro valor numerico e rejeitado
