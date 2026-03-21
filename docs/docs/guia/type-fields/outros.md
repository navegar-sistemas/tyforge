---
title: Outros
sidebar_position: 6
---

# Type Fields — Outros

Type Fields complementares para booleanos, objetos JSON, status HTTP, status de aplicacao e chaves publicas PEM.

## Resumo

| Classe | Tipo primitivo | Validacao | Arquivo |
|--------|---------------|-----------|---------|
| `FBoolean` | `boolean` | Coercao de string/number para boolean | `boolean.format_vo.ts` |
| `FJson` | `Record<string, unknown>` | Objeto JSON valido | `json.format_vo.ts` |
| `FHttpStatus` | `number` (enum) | Enum `OHttpStatus` | `http-status.format_vo.ts` |
| `FStatusAplicacao` | `string` (enum) | `"active"` ou `"inactive"` | `status-aplicacao.format_vo.ts` |
| `FPublicKeyPem` | `string` | Formato PEM com headers BEGIN/END | `public-key-pem.format_vo.ts` |

---

## FBoolean

Valor booleano com coercao inteligente. Aceita `boolean`, `string` (`"true"`, `"false"`, `"1"`, `"0"`, `"yes"`, `"no"`) e `number` (`1`, `0`).

```typescript
import { FBoolean } from "@navegar-sistemas/tyforge";

const result = FBoolean.create(true);
// Result<FBoolean, ExceptionValidation>

// Coercao a partir de string
const fromString = FBoolean.createOrThrow("yes");
fromString.getValue(); // true

// Coercao a partir de number
const fromNumber = FBoolean.createOrThrow(0);
fromNumber.getValue(); // false
```

**Valores aceitos:**
| Entrada | Resultado |
|---------|-----------|
| `true`, `"true"`, `"1"`, `"yes"`, `1` | `true` |
| `false`, `"false"`, `"0"`, `"no"`, `0` | `false` |

---

## FJson

Objeto JSON generico (`Record<string, unknown>`). Aceita tanto objetos quanto strings JSON validas (que sao parseadas automaticamente).

```typescript
import { FJson } from "@navegar-sistemas/tyforge";

// A partir de objeto
const result = FJson.create({ nome: "Maria", idade: 30 });
// Result<FJson, ExceptionValidation>

// A partir de string JSON
const fromStr = FJson.create('{"chave": "valor"}');

const json = FJson.createOrThrow({ dados: [1, 2, 3] });
```

**Metodos de instancia:**

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `serialize()` | `string` | Serializa para string JSON |
| `get(key)` | `unknown` | Retorna valor de uma chave |
| `has(key)` | `boolean` | Verifica se chave existe |
| `keys()` | `string[]` | Lista todas as chaves |
| `isEmpty()` | `boolean` | Verifica se objeto esta vazio |

```typescript
const json = FJson.createOrThrow({ nome: "Maria", idade: 30 });

json.get("nome");     // "Maria"
json.has("idade");    // true
json.keys();          // ["nome", "idade"]
json.isEmpty();       // false
json.serialize();     // '{"nome":"Maria","idade":30}'
json.formatted();     // JSON formatado com indentacao (2 espacos)
```

---

## FHttpStatus

Codigo de status HTTP conforme especificacao RFC 7231. Validado contra o enum `OHttpStatus`.

```typescript
import { FHttpStatus, OHttpStatus } from "@navegar-sistemas/tyforge";

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

**Tipos relacionados:**
- `TKeyHttpStatus` — chaves do enum (`"OK"`, `"CREATED"`, etc.)
- `THttpStatus` — valores numericos do enum (`200`, `201`, etc.)

---

## FStatusAplicacao

Status de uma aplicacao no sistema. Aceita apenas os valores `"active"` ou `"inactive"`.

```typescript
import { FStatusAplicacao, OStatusAplicacao } from "@navegar-sistemas/tyforge";

const result = FStatusAplicacao.create("active");
// Result<FStatusAplicacao, ExceptionValidation>

// Criar a partir de booleano
const status = FStatusAplicacao.fromBoolean(true);
status.getValue(); // "active"

// Gerar status ativo por padrao
const ativo = FStatusAplicacao.generate();
ativo.getValue(); // "active"

// Verificar se esta ativo
ativo.isActive(); // true
```

### Constante `OStatusAplicacao`

```typescript
export const OStatusAplicacao = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;
```

**Metodos estaticos:**
- `fromBoolean(isActive)` — converte booleano para status
- `generate()` — cria instancia com status `"active"`

**Metodos de instancia:**
- `isActive()` — retorna `true` se o status for `"active"`

---

## FPublicKeyPem

Chave publica no formato PEM (Privacy-Enhanced Mail) para autenticacao assimetrica. Valida a presenca dos delimitadores e o conteudo base64.

```typescript
import { FPublicKeyPem } from "@navegar-sistemas/tyforge";

const pem = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA...
-----END PUBLIC KEY-----`;

const result = FPublicKeyPem.create(pem);
// Result<FPublicKeyPem, ExceptionValidation>

const chave = FPublicKeyPem.createOrThrow(pem);
chave.formatted(); // Valor com trim
```

**Regras de validacao:**
- Comprimento entre 100 e 1000 caracteres
- Deve conter `-----BEGIN PUBLIC KEY-----` e `-----END PUBLIC KEY-----`
- Conteudo entre os delimitadores deve ser base64 valido com no minimo 100 caracteres
