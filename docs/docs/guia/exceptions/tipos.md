---
title: Tipos de Exceção
sidebar_position: 2
---

# Tipos de Exceção

O TyForge fornece seis classes de exceção especializadas, cada uma com factory methods estáticos que encapsulam os metadados RFC 7807 apropriados.

## Catálogo

| Classe | Status HTTP | Descrição |
|--------|-------------|-----------|
| `ExceptionValidation` | 400 | Erros de validação de dados de entrada |
| `ExceptionBusiness` | 422, 409, 403, 404, 500 | Violações de regras de negócio |
| `ExceptionNotFound` | 404 | Recurso não encontrado |
| `ExceptionAuth` | 401, 403, 400, 404, 409, 429 | Erros de autenticação e autorização |
| `ExceptionDb` | 400, 404, 409, 422, 500, 503 | Erros de banco de dados |
| `ExceptionUnexpected` | 500 | Erros inesperados e não tratados |

---

## ExceptionValidation

Erros de validação de dados de entrada. Status HTTP 400 (Bad Request).

```typescript
import { ExceptionValidation } from "tyforge";

const erro = ExceptionValidation.create("email", "Email deve ter formato válido");
// ExceptionValidation {
//   type: "ExceptionValidation",
//   title: "Erro de Validação",
//   status: 400,
//   detail: "Email deve ter formato válido",
//   field: "email",
//   code: "VALIDATION_ERROR"
// }
```

**Factory methods:**

| Método | Descrição |
|--------|-----------|
| `create(field?, detail?)` | Cria exceção de validação. Padrão: field `"UNKNOWN_FIELD"`, detail `"Valor inválido"` |

Esta é a exceção mais utilizada no TyForge — todos os TypeFields retornam `ExceptionValidation` quando a validação falha via `create()`.

---

## ExceptionBusiness

Violações de regras de negócio. O status HTTP varia conforme o tipo de violação.

```typescript
import { ExceptionBusiness } from "tyforge";

// Regra de negócio inválida
const regra = ExceptionBusiness.invalidBusinessRule("Saldo deve ser positivo");
// status: 422, code: "BUSINESS_INVALID_RULE"

// Entrada duplicada
const duplicado = ExceptionBusiness.duplicateEntry("email");
// status: 409, detail: "Já existe um registro com email informado"

// Recurso não encontrado (via business)
const naoEncontrado = ExceptionBusiness.notFound("Conta");
// status: 404, detail: "Conta não encontrado(a)"
```

**Factory methods:**

| Método | Status | Code |
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

Recurso não encontrado. Status HTTP 404.

```typescript
import { ExceptionNotFound } from "tyforge";

const generico = ExceptionNotFound.generic();
// detail: "O recurso solicitado não foi encontrado."

const registro = ExceptionNotFound.registro();
// detail: "Nenhum registro encontrado."

const externo = ExceptionNotFound.externalService();
// detail: "Falha ao acessar recurso externo, tente novamente mais tarde."
```

**Factory methods:**

| Método | Code | Descrição |
|--------|------|-----------|
| `generic()` | `NOT_FOUND_GENERIC` | Recurso genérico não encontrado |
| `registro()` | `NOT_FOUND_REGISTRO` | Nenhum registro encontrado |
| `externalService()` | `NOT_FOUND_EXTERNAL_SERVICE` | Falha ao acessar recurso externo |

---

## ExceptionAuth

Erros de autenticação e autorização. O status HTTP varia conforme o cenário.

```typescript
import { ExceptionAuth } from "tyforge";

const credenciais = ExceptionAuth.invalidCredentials();
// status: 401, code: "AUTH_INVALID_CREDENTIALS"

const token = ExceptionAuth.invalidToken();
// status: 401, code: "AUTH_INVALID_TOKEN"

const acesso = ExceptionAuth.accessDenied();
// status: 403, code: "AUTH_ACCESS_DENIED"
```

**Factory methods (principais):**

| Método | Status | Code |
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

Métodos como `mfaLockout()` e `rateLimited()` aceitam `retryAfterSeconds` em `additionalFields`. O método `stepUpRequired(scope)` adiciona `required_scope` em `additionalFields`.

---

## ExceptionDb

Erros de banco de dados. O status HTTP varia conforme o tipo de erro.

```typescript
import { ExceptionDb } from "tyforge";

const naoEncontrado = ExceptionDb.recordNotFound();
// status: 404, code: "DB_RECORD_NOT_FOUND"

const conexão = ExceptionDb.connectionError();
// status: 503, code: "DB_CONNECTION_ERROR"

const fk = ExceptionDb.foreignKeyConstraintViolation("cliente_id");
// status: 400, detail: "O cliente_id informado não existe no sistema"
```

**Factory methods:**

| Método | Status | Code |
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

Erros inesperados e não tratados. Status HTTP 500 (Internal Server Error).

```typescript
import ExceptionUnexpected from "tyforge";

const erro = ExceptionUnexpected.create({
  message: "Conexão recusada pelo servidor remoto",
  stack: error.stack,
  context: { serviço: "api-pagamentos", tentativa: 3 },
});
// status: 500, code: "UNEXPECTED_ERROR"

const externo = ExceptionUnexpected.externalService({
  message: "Timeout na API de terceiros",
});
// status: 500, detail: "Erro ao acessar serviço externo"
```

**Factory methods:**

| Método | Descrição |
|--------|-----------|
| `create(log?)` | Cria exceção inesperada com log opcional (`message`, `stack`, `context`) |
| `externalService(log?)` | Cria exceção para falha em serviço externo |

A propriedade `log` (tipo `ExceptionLog`) permite anexar informações de diagnóstico sem expor ao cliente:

```typescript
interface ExceptionLog {
  message?: string;
  stack?: string;
  context?: Record<string, unknown>;
}
```

---

## Uso com Result pattern

As exceções são tipicamente encapsuladas em `Result` via o helper `err()`:

```typescript
import { err, ok, Result } from "tyforge";
import { ExceptionBusiness } from "tyforge";

function sacar(valor: number, saldo: number): Result<number, ExceptionBusiness> {
  if (valor > saldo) {
    return err(ExceptionBusiness.insufficientBalance());
  }
  return ok(saldo - valor);
}
```

Para TypeFields, a exceção é retornada automaticamente pelo `create()`:

```typescript
const result = FEmail.create("inválido");
// Result<FEmail, ExceptionValidation>
// result.error.field === "Email"
// result.error.detail === "Email deve ter formato válido"
```
