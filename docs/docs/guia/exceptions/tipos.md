---
title: Tipos de Excecao
sidebar_position: 2
---

# Tipos de Excecao

O TyForge fornece seis classes de excecao especializadas, cada uma com factory methods estaticos que encapsulam os metadados RFC 7807 apropriados.

## Catalogo

| Classe | Status HTTP | Descricao |
|--------|-------------|-----------|
| `ExceptionValidation` | 400 | Erros de validacao de dados de entrada |
| `ExceptionBusiness` | 422, 409, 403, 404, 500 | Violacoes de regras de negocio |
| `ExceptionNotFound` | 404 | Recurso nao encontrado |
| `ExceptionAuth` | 401, 403, 400, 404, 409, 429 | Erros de autenticacao e autorizacao |
| `ExceptionDb` | 400, 404, 409, 422, 500, 503 | Erros de banco de dados |
| `ExceptionUnexpected` | 500 | Erros inesperados e nao tratados |

---

## ExceptionValidation

Erros de validacao de dados de entrada. Status HTTP 400 (Bad Request).

```typescript
import { ExceptionValidation } from "@navegar-sistemas/tyforge";

const erro = ExceptionValidation.create("email", "Email deve ter formato valido");
// ExceptionValidation {
//   type: "ExceptionValidation",
//   title: "Erro de Validacao",
//   status: 400,
//   detail: "Email deve ter formato valido",
//   field: "email",
//   code: "VALIDATION_ERROR"
// }
```

**Factory methods:**

| Metodo | Descricao |
|--------|-----------|
| `create(field?, detail?)` | Cria excecao de validacao. Padrao: field `"UNKNOWN_FIELD"`, detail `"Valor invalido"` |

Esta e a excecao mais utilizada no TyForge — todos os TypeFields retornam `ExceptionValidation` quando a validacao falha via `create()`.

---

## ExceptionBusiness

Violacoes de regras de negocio. O status HTTP varia conforme o tipo de violacao.

```typescript
import { ExceptionBusiness } from "@navegar-sistemas/tyforge";

// Regra de negocio invalida
const regra = ExceptionBusiness.invalidBusinessRule("Saldo deve ser positivo");
// status: 422, code: "BUSINESS_INVALID_RULE"

// Entrada duplicada
const duplicado = ExceptionBusiness.duplicateEntry("email");
// status: 409, detail: "Ja existe um registro com email informado"

// Recurso nao encontrado (via business)
const naoEncontrado = ExceptionBusiness.notFound("Conta");
// status: 404, detail: "Conta nao encontrado(a)"
```

**Factory methods:**

| Metodo | Status | Code |
|--------|--------|------|
| `invalidBusinessRule(debug)` | 422 | `BUSINESS_INVALID_RULE` |
| `operationNotAllowed()` | 403 | `BUSINESS_OPERATION_NOT_ALLOWED` |
| `insufficientBalance()` | 422 | `BUSINESS_INSUFFICIENT_BALANCE` |
| `limitExceeded()` | 422 | `BUSINESS_LIMIT_EXCEEDED` |
| `duplicateEntry(field?)` | 409 | `BUSINESS_DUPLICATE_ENTRY` |
| `invalidState()` | 422 | `BUSINESS_INVALID_STATE` |
| `notFound(resource?)` | 404 | `BUSINESS_NOT_FOUND` |
| `notImplemented()` | 500 | `BUSINESS_NOT_IMPLEMENTED` |

---

## ExceptionNotFound

Recurso nao encontrado. Status HTTP 404.

```typescript
import { ExceptionNotFound } from "@navegar-sistemas/tyforge";

const generico = ExceptionNotFound.generic();
// detail: "O recurso solicitado nao foi encontrado."

const registro = ExceptionNotFound.registro();
// detail: "Nenhum registro encontrado."

const externo = ExceptionNotFound.externalService();
// detail: "Falha ao acessar recurso externo, tente novamente mais tarde."
```

**Factory methods:**

| Metodo | Code | Descricao |
|--------|------|-----------|
| `generic()` | `NOT_FOUND_GENERIC` | Recurso generico nao encontrado |
| `registro()` | `NOT_FOUND_REGISTRO` | Nenhum registro encontrado |
| `externalService()` | `NOT_FOUND_EXTERNAL_SERVICE` | Falha ao acessar recurso externo |

---

## ExceptionAuth

Erros de autenticacao e autorizacao. O status HTTP varia conforme o cenario.

```typescript
import { ExceptionAuth } from "@navegar-sistemas/tyforge";

const credenciais = ExceptionAuth.invalidCredentials();
// status: 401, code: "AUTH_INVALID_CREDENTIALS"

const token = ExceptionAuth.invalidToken();
// status: 401, code: "AUTH_INVALID_TOKEN"

const acesso = ExceptionAuth.accessDenied();
// status: 403, code: "AUTH_ACCESS_DENIED"
```

**Factory methods (principais):**

| Metodo | Status | Code |
|--------|--------|------|
| `invalidCredentials()` | 401 | `AUTH_INVALID_CREDENTIALS` |
| `invalidToken()` | 401 | `AUTH_INVALID_TOKEN` |
| `accountDisabled()` | 403 | `AUTH_ACCOUNT_DISABLED` |
| `accountLocked()` | 403 | `AUTH_ACCOUNT_LOCKED` |
| `invalidSignature()` | 401 | `AUTH_INVALID_SIGNATURE` |
| `accessDenied()` | 403 | `AUTH_ACCESS_DENIED` |
| `userNotFound()` | 404 | `AUTH_USER_NOT_FOUND` |
| `replayAttackDetected()` | 401 | `AUTH_REPLAY_DETECTED` |
| `requestExpired()` | 401 | `AUTH_REQUEST_EXPIRED` |
| `mfaRequired()` | 400 | `AUTH_MFA_REQUIRED` |
| `mfaLockout(retryAfterSeconds?)` | 429 | `AUTH_MFA_LOCKOUT` |
| `invalidMfaCode()` | 401 | `AUTH_INVALID_MFA_CODE` |
| `rateLimited(retryAfterSeconds?)` | 429 | `AUTH_RATE_LIMITED` |
| `sessionRevoked()` | 401 | `AUTH_SESSION_REVOKED` |
| `tenantDisabled()` | 403 | `AUTH_TENANT_DISABLED` |
| `tenantMismatch()` | 403 | `AUTH_TENANT_MISMATCH` |
| `stepUpRequired(scope)` | 403 | `AUTH_STEP_UP_REQUIRED` |
| `totpNotEnabled()` | 400 | `AUTH_TOTP_NOT_ENABLED` |
| `invalidTotp()` | 401 | `AUTH_INVALID_TOTP` |
| `totpAlreadyEnabled()` | 409 | `AUTH_TOTP_ALREADY_ENABLED` |
| `email2faAlreadyEnabled()` | 409 | `AUTH_EMAIL2FA_ALREADY_ENABLED` |
| `email2faNotEnabled()` | 400 | `AUTH_EMAIL2FA_NOT_ENABLED` |
| `codeExpiredOrNotFound()` | 400 | `AUTH_CODE_EXPIRED` |
| `invalidInviteToken()` | 400 | `AUTH_INVALID_INVITE_TOKEN` |
| `invalidBackupCode()` | 401 | `AUTH_INVALID_BACKUP_CODE` |

Metodos como `mfaLockout()` e `rateLimited()` aceitam `retryAfterSeconds` em `additionalFields`. O metodo `stepUpRequired(scope)` adiciona `required_scope` em `additionalFields`.

---

## ExceptionDb

Erros de banco de dados. O status HTTP varia conforme o tipo de erro.

```typescript
import { ExceptionDb } from "@navegar-sistemas/tyforge";

const naoEncontrado = ExceptionDb.recordNotFound();
// status: 404, code: "DB_RECORD_NOT_FOUND"

const conexao = ExceptionDb.connectionError();
// status: 503, code: "DB_CONNECTION_ERROR"

const fk = ExceptionDb.foreignKeyConstraintViolation("cliente_id");
// status: 400, detail: "O cliente_id informado nao existe no sistema"
```

**Factory methods:**

| Metodo | Status | Code |
|--------|--------|------|
| `recordNotFound()` | 404 | `DB_RECORD_NOT_FOUND` |
| `duplicateEntry()` | 409 | `DB_DUPLICATE_ENTRY` |
| `invalidData()` | 422 | `DB_INVALID_DATA` |
| `unexpectedError()` | 500 | `DB_UNEXPECTED_ERROR` |
| `connectionError()` | 503 | `DB_CONNECTION_ERROR` |
| `transactionError()` | 500 | `DB_TRANSACTION_ERROR` |
| `queryError()` | 500 | `DB_QUERY_ERROR` |
| `foreignKeyConstraintViolation(field?)` | 400 | `DB_FOREIGN_KEY_VIOLATION` |

---

## ExceptionUnexpected

Erros inesperados e nao tratados. Status HTTP 500 (Internal Server Error).

```typescript
import ExceptionUnexpected from "@navegar-sistemas/tyforge";

const erro = ExceptionUnexpected.create({
  message: "Conexao recusada pelo servidor remoto",
  stack: error.stack,
  context: { servico: "api-pagamentos", tentativa: 3 },
});
// status: 500, code: "UNEXPECTED_ERROR"

const externo = ExceptionUnexpected.externalService({
  message: "Timeout na API de terceiros",
});
// status: 500, detail: "Erro ao acessar servico externo"
```

**Factory methods:**

| Metodo | Descricao |
|--------|-----------|
| `create(log?)` | Cria excecao inesperada com log opcional (`message`, `stack`, `context`) |
| `externalService(log?)` | Cria excecao para falha em servico externo |

A propriedade `log` (tipo `ExceptionLog`) permite anexar informacoes de diagnostico sem expor ao cliente:

```typescript
interface ExceptionLog {
  message?: string;
  stack?: string;
  context?: Record<string, unknown>;
}
```

---

## Uso com Result pattern

As excecoes sao tipicamente encapsuladas em `Result` via o helper `err()`:

```typescript
import { err, ok, Result } from "@navegar-sistemas/tyforge";
import { ExceptionBusiness } from "@navegar-sistemas/tyforge";

function sacar(valor: number, saldo: number): Result<number, ExceptionBusiness> {
  if (valor > saldo) {
    return err(ExceptionBusiness.insufficientBalance());
  }
  return ok(saldo - valor);
}
```

Para TypeFields, a excecao e retornada automaticamente pelo `create()`:

```typescript
const result = FEmail.create("invalido");
// Result<FEmail, ExceptionValidation>
// result.error.field === "Email"
// result.error.detail === "Email deve ter formato valido"
```
