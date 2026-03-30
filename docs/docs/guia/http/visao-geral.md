---
title: HTTP Client
sidebar_position: 1
---

# HTTP Client

O TyForge fornece uma classe base abstrata `ServiceHttp` para construir clientes HTTP type-safe com integração nativa ao Result pattern. Toda requisição retorna `Result<IHttpResponse<T>, Exceptions>` — nunca lança exceções.

## Conceito

`ServiceHttp` é uma classe abstrata que encapsula `fetch` com:

- Validação de segurança automática em URLs e headers
- Serialização de body (JSON e form-urlencoded)
- Timeout configurável via `AbortController`
- Autenticação plugável via método abstrato
- Métodos de conveniência (`get`, `post`, `put`, `delete`, `patch`)
- Retorno sempre via Result pattern — sem try/catch no código consumidor

## Criando um cliente HTTP

Para usar, crie uma classe concreta que estenda `ServiceHttp` e implemente `endpoint` e `getAuthHeaders()`:

```typescript
import { ServiceHttp, ExceptionHttp } from "tyforge/http";
import { ok, err, isSuccess, isFailure } from "tyforge/result";
import type { IHttpResponse, THttpResult } from "tyforge/http";
import type { Result } from "tyforge/result";
import type { Exceptions } from "tyforge/exceptions";

class PaymentGatewayClient extends ServiceHttp {
  readonly endpoint = FUrlOrigin.createOrThrow("https://api.gateway.com/v1");

  protected async getAuthHeaders(): Promise<Result<Record<string, string>, Exceptions>> {
    const token = await this.fetchToken();
    if (!token) return err(ExceptionHttp.authFailed());
    return ok({ Authorization: `Bearer ${token}` });
  }

  private async fetchToken(): Promise<string | null> {
    // lógica de obtenção do token
    return "my-api-token";
  }

  async createCharge(amount: number, description: string): THttpResult<unknown> {
    return this.post("/charges", { amount, description }, { authenticated: true });
  }

  async getCharge(chargeId: string): THttpResult<unknown> {
    return this.get(`/charges/${chargeId}`, undefined, { authenticated: true });
  }

  async cancelCharge(chargeId: string): THttpResult<unknown> {
    return this.delete(`/charges/${chargeId}`, undefined, { authenticated: true });
  }
}
```

## Métodos de conveniência

`ServiceHttp` fornece cinco métodos protegidos que delegam para `request()`:

| Método | Assinatura | Descrição |
|--------|-----------|-----------|
| `get` | `get<D>(endpoint, data?, options?)` | Requisição GET. `data` é convertido em query params |
| `post` | `post<D>(endpoint, data, options?)` | Requisição POST com body |
| `put` | `put<D>(endpoint, data, options?)` | Requisição PUT com body |
| `delete` | `delete<D>(endpoint, data?, options?)` | Requisição DELETE |
| `patch` | `patch<D>(endpoint, data, options?)` | Requisição PATCH com body |

Todos retornam `THttpResult<unknown>`, que é `Promise<Result<IHttpResponse<unknown>, Exceptions>>`.

## Tipos

### IRequestParams

Parâmetros completos para uma requisição:

```typescript
interface IRequestParams<TData = unknown> {
  endpoint: FUrlPath;          // caminho relativo ao endpoint base
  method: THttpMethod;         // "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  data?: TData;                // body (POST/PUT/PATCH) ou query params (GET)
  format?: THttpFormat;        // "json" (default) ou "form"
  headers?: Record<string, string>;  // headers adicionais
  authenticated?: boolean;     // se true, chama getAuthHeaders()
  timeout?: number;            // timeout em milissegundos (máximo 300000)
}
```

### TRequestOptions

Tipo derivado de `IRequestParams` para os métodos de conveniência — exclui `endpoint`, `method` e `data` (já passados como argumentos):

```typescript
type TRequestOptions = Omit<IRequestParams, "endpoint" | "method" | "data">;
// Equivale a: { format?, headers?, authenticated?, timeout? }
```

### IHttpResponse

Resposta HTTP padronizada:

```typescript
interface IHttpResponse<T> {
  status: number;              // código HTTP (200, 201, 404, etc.)
  data: T;                     // body parseado (JSON ou texto)
  headers: Record<string, string>;  // headers da resposta
}
```

### THttpResult

Type alias para o retorno de todas as requisições:

```typescript
type THttpResult<T> = Promise<Result<IHttpResponse<T>, Exceptions>>;
```

## Timeout

O timeout é configurável por requisição via o campo `timeout` em milissegundos. Internamente usa `AbortController` para cancelar a requisição se o tempo exceder o limite.

- Valor máximo: 300000ms (5 minutos)
- Valores negativos ou zero são ignorados
- Valores decimais são arredondados para baixo (`Math.floor`)
- Se o timeout for atingido, retorna `ExceptionHttp.timeout()` com status `504 Gateway Timeout`

```typescript
// Requisição com timeout de 10 segundos
const result = await client.get("/slow-endpoint", undefined, { timeout: 10000 });

if (isFailure(result)) {
  // result.error pode ser ExceptionHttp com code "REQUEST_TIMEOUT"
}
```

## Serialização

### JSON (default)

Quando `format` é `"json"` (ou omitido), o body é serializado via `JSON.stringify()` e o `Content-Type` é definido como `application/json;charset=UTF-8`.

### Form-urlencoded

Quando `format` é `"form"`, o body é serializado via `URLSearchParams` e o `Content-Type` é definido como `application/x-www-form-urlencoded;charset=UTF-8`. Apenas valores primitivos são aceitos — objetos e arrays no body causam erro de serialização.

### GET com query params

Em requisições GET, o campo `data` é convertido automaticamente em query parameters. Apenas valores primitivos são aceitos — objetos e arrays aninhados retornam `ExceptionHttp.failedSerialization()`.

```typescript
// GET /users?page=1&limit=10
const result = await client.get("/users", { page: 1, limit: 10 });
```

## Segurança — ServiceHttpSecurity

`ServiceHttpSecurity` é uma classe utilitária que protege contra ataques comuns em clientes HTTP. Toda URL e header passa por validação antes de ser enviada.

### Proteções implementadas

| Ataque | Proteção |
|--------|----------|
| **Path traversal** | Rejeita endpoints com `../` em qualquer posição |
| **CRLF injection** | Rejeita endpoints com `\r` ou `\n` |
| **Null byte injection** | Rejeita endpoints com `\0` |
| **SSRF (parcial)** | Rejeita endpoints que são URLs absolutas |
| **Header injection** | Remove caracteres `\r`, `\n`, `\0` de chaves e valores de headers |
| **Prototype pollution** | Ignora headers com chaves `__proto__`, `constructor`, `prototype` |

### Métodos

| Método | Assinatura | Descrição |
|--------|-----------|-----------|
| `isValidRelativePath` | `(path: string) => boolean` | Valida se o path é relativo e seguro |
| `sanitizeHeaders` | `(headers: Record<string, string>) => Record<string, string>` | Remove caracteres perigosos de headers |
| `buildUrl` | `(endpoint: string, endpoint: string) => Result<string, Exceptions>` | Constrói URL segura a partir de base + endpoint |

### Exemplo de rejeição

```typescript
import { ServiceHttpSecurity } from "tyforge/http";
import { isFailure } from "tyforge/result";

// Path traversal — rejeitado
const r1 = ServiceHttpSecurity.buildUrl("https://api.com", "../etc/passwd");
// isFailure(r1) === true, code: "UNSAFE_ENDPOINT"

// CRLF injection — rejeitado
const r2 = ServiceHttpSecurity.buildUrl("https://api.com", "users\r\nX-Injected: true");
// isFailure(r2) === true, code: "UNSAFE_ENDPOINT"

// URL absoluta — rejeitado (evita SSRF)
const r3 = ServiceHttpSecurity.buildUrl("https://api.com", "https://evil.com/steal");
// isFailure(r3) === true, code: "UNSAFE_ENDPOINT"

// Path válido — aceito
const r4 = ServiceHttpSecurity.buildUrl("https://api.com", "/users/123");
// isSuccess(r4) === true, r4.value === "https://api.com/users/123"
```

## ExceptionHttp

`ExceptionHttp` estende `Exceptions` (RFC 7807) e fornece factory methods estáticos para cada cenário de erro:

| Factory Method | Código | Status HTTP | Retriável | Quando |
|---------------|--------|-------------|-----------|--------|
| `unsafeEndpoint()` | `UNSAFE_ENDPOINT` | 400 Bad Request | Não | Endpoint contém path traversal, URL absoluta ou CRLF |
| `failedUrlConstruction()` | `FAILED_URL_CONSTRUCTION` | 400 Bad Request | Não | Não foi possível construir URL válida |
| `failedSerialization()` | `FAILED_SERIALIZATION` | 400 Bad Request | Não | Falha ao serializar body da requisição |
| `authFailed(cause?)` | `AUTH_FAILED` | 401 Unauthorized | Não | `getAuthHeaders()` falhou (erro original acessível via `error.cause`) |
| `externalApiFailed(err?)` | `EXTERNAL_API_FAILED` | 502 Bad Gateway | Sim | API externa retornou erro ou falhou |
| `timeout()` | `REQUEST_TIMEOUT` | 504 Gateway Timeout | Sim | Timeout atingido |

O campo `retriable` indica se a operação pode ser tentada novamente. `externalApiFailed` e `timeout` são retriáveis por padrão.

Quando `externalApiFailed` recebe um `IExternalError`, o status e data da resposta externa são armazenados no campo `externalError` (não enumerável — não aparece em `JSON.stringify`):

```typescript
import { isFailure } from "tyforge/result";

const result = await client.post("/charges", chargeData, { authenticated: true });

if (isFailure(result)) {
  const error = result.error;
  // error.status      → 502
  // error.code        → "EXTERNAL_API_FAILED"
  // error.retriable   → true
  // error.externalError?.status → 422 (status real da API externa)
  // error.externalError?.data   → body retornado pela API externa
}
```

## Integração com Result pattern

Toda operação HTTP retorna `Result` — o código consumidor nunca precisa de try/catch:

```typescript
import { isSuccess, isFailure } from "tyforge/result";

const result = await client.createCharge(5000, "Pedido #123");

if (isSuccess(result)) {
  const { status, data, headers } = result.value;
  console.log(`Charge created: ${status}`);
}

if (isFailure(result)) {
  const error = result.error;
  if (error.retriable) {
    // pode tentar novamente
  }
}
```

## Pontos de extensão

A classe `ServiceHttp` foi projetada para ser estendida. Além de `endpoint` e `getAuthHeaders()`, o código consumidor pode:

- Sobrescrever `request()` para adicionar retry, circuit breaker ou logging
- Combinar com `IRetryPolicy` e `ICircuitBreaker` da camada de infraestrutura
- Adicionar interceptors antes/depois da requisição ao sobrescrever `request()`

```typescript
class ResilientClient extends ServiceHttp {
  readonly endpoint = FUrlOrigin.createOrThrow("https://api.example.com");

  protected async getAuthHeaders() {
    return ok({ "X-Api-Key": "secret" });
  }

  // Override para adicionar retry
  protected override async request<TData>(params: IRequestParams<TData>): THttpResult<unknown> {
    let lastResult = await super.request(params);
    for (let attempt = 0; attempt < 2; attempt++) {
      if (isSuccess(lastResult)) return lastResult;
      if (!lastResult.error.retriable) return lastResult;
      lastResult = await super.request(params);
    }
    return lastResult;
  }
}
```
