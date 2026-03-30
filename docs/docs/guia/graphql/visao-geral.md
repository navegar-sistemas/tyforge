---
title: GraphQL Client
sidebar_position: 1
---

# GraphQL Client

O TyForge fornece uma classe base abstrata `ServiceGraphQL` para construir clientes GraphQL type-safe com integração nativa ao Result pattern. Toda operação retorna `Result<T, Exceptions>` — nunca lança exceções.

## Conceito

`ServiceGraphQL` é uma classe abstrata que encapsula `fetch` com:

- Bloqueio automático de introspection queries
- Sanitização recursiva de variables contra prototype pollution
- Validação HTTPS no endpoint (aceita localhost em desenvolvimento)
- Timeout configurável via `AbortController`
- Autenticação plugável via método abstrato
- Métodos de conveniência (`query`, `mutation`)
- Detecção automática de `UNAUTHENTICATED` via `extensions.code` ou `message`
- Extração automática de `operationName` do document GraphQL
- Retorno sempre via Result pattern — sem try/catch no código consumidor

## Criando um cliente GraphQL

Para usar, crie uma classe concreta que estenda `ServiceGraphQL` e implemente `endpoint` e `getAuthHeaders()`:

```typescript
import { ServiceGraphQL, ExceptionGraphQL } from "tyforge/graphql";
import { ok, err, isSuccess, isFailure } from "tyforge/result";
import type { TGraphQLResult } from "tyforge/graphql";
import type { Result } from "tyforge/result";
import type { Exceptions } from "tyforge/exceptions";

class PaymentGraphQLClient extends ServiceGraphQL {
  readonly endpoint = FUrlOrigin.createOrThrow("https://api.gateway.com/graphql");

  protected async getAuthHeaders(): Promise<Result<Record<string, string>, Exceptions>> {
    const token = await this.fetchToken();
    if (!token) return err(ExceptionGraphQL.unauthorized());
    return ok({ Authorization: `Bearer ${token}` });
  }

  private async fetchToken(): Promise<string | null> {
    // lógica de obtenção do token
    return "my-api-token";
  }

  async getCharges(): TGraphQLResult<unknown> {
    return this.query(
      `query GetCharges { charges { id amount status } }`,
      undefined,
      { authenticated: true },
    );
  }

  async createCharge(amount: number, description: string): TGraphQLResult<unknown> {
    return this.mutation(
      `mutation CreateCharge($amount: Int!, $description: String!) {
        createCharge(amount: $amount, description: $description) { id status }
      }`,
      { amount, description },
      { authenticated: true },
    );
  }
}
```

## Métodos

`ServiceGraphQL` fornece dois métodos protegidos que delegam para `execute()`:

| Método | Assinatura | Descrição |
|--------|-----------|-----------|
| `query` | `query(document, variables?, options?)` | Executa uma query GraphQL |
| `mutation` | `mutation(document, variables?, options?)` | Executa uma mutation GraphQL |

Ambos retornam `TGraphQLResult<unknown>`, que é `Promise<Result<T, Exceptions>>`.

## Tipos

### IGraphQLRequest

Parâmetros completos para uma requisição GraphQL:

```typescript
interface IGraphQLRequest<TVars = Record<string, unknown>> {
  query: string;                        // document GraphQL (query ou mutation)
  variables?: TVars;                    // variáveis da operação
  operationName?: string;              // nome da operação (extraído automaticamente se omitido)
  headers?: Record<string, string>;    // headers adicionais
  authenticated?: boolean;             // se true, chama getAuthHeaders()
  timeout?: number;                    // timeout em milissegundos (máximo 300000)
  fetchPolicy?: TFetchPolicy;         // política de cache
}
```

### TGraphQLRequestOptions

Tipo derivado de `IGraphQLRequest` para os métodos de conveniência — exclui `query` e `variables` (já passados como argumentos):

```typescript
type TGraphQLRequestOptions = Omit<IGraphQLRequest, "query" | "variables">;
// Equivale a: { operationName?, headers?, authenticated?, timeout?, fetchPolicy? }
```

### IGraphQLError

Erro GraphQL padronizado conforme a especificação:

```typescript
interface IGraphQLError {
  message: string;                                           // mensagem de erro
  locations?: ReadonlyArray<{ line: number; column: number }>; // posição no document
  path?: ReadonlyArray<string | number>;                     // caminho no resultado
  extensions?: Record<string, unknown>;                      // metadados (ex: code)
}
```

### IGraphQLResponse

Resposta GraphQL padronizada:

```typescript
interface IGraphQLResponse<TData> {
  data: TData;                  // dados retornados
  errors?: IGraphQLError[];     // erros parciais ou totais
}
```

### TGraphQLResult

Type alias para o retorno de todas as operações:

```typescript
type TGraphQLResult<T> = Promise<Result<T, Exceptions>>;
```

### TFetchPolicy

Política de cache para operações:

```typescript
type TFetchPolicy = "network-only" | "cache-first" | "no-cache";
```

## Timeout

O timeout é configurável por operação via o campo `timeout` em milissegundos. Internamente usa `AbortController` para cancelar a requisição se o tempo exceder o limite.

- Valor máximo: 300000ms (5 minutos)
- Valores menores que 1 são ignorados
- Valores decimais são arredondados para baixo (`Math.floor`)
- Se o timeout for atingido, retorna `ExceptionGraphQL.timeout()` com status `504 Gateway Timeout`

```typescript
// Query com timeout de 10 segundos
const result = await client.getCharges({ timeout: 10000 });

if (isFailure(result)) {
  // result.error pode ser ExceptionGraphQL com code "GRAPHQL_TIMEOUT"
}
```

## Segurança — ServiceGraphQLSecurity

`ServiceGraphQLSecurity` é uma classe utilitária que protege contra ataques comuns em clientes GraphQL. Toda operação passa por validação antes de ser enviada.

### Proteções implementadas

| Ataque | Proteção |
|--------|----------|
| **Introspection** | Bloqueia queries contendo `__schema` ou `__type` |
| **Prototype pollution** | Sanitização recursiva de variables — remove chaves `__proto__`, `constructor`, `prototype` |
| **HTTPS validation** | Rejeita endpoints que não sejam HTTPS (aceita `localhost` e `127.0.0.1` para desenvolvimento) |
| **Header injection** | Headers sanitizados via `ServiceHttpSecurity.sanitizeHeaders()` (reutiliza proteção do módulo HTTP) |

### Métodos

| Método | Assinatura | Descrição |
|--------|-----------|-----------|
| `isIntrospectionQuery` | `(query: string) => boolean` | Detecta `__schema` ou `__type` no document |
| `sanitizeVariables` | `(variables: Record<string, unknown>) => Record<string, unknown>` | Remove chaves perigosas recursivamente |
| `isSecureEndpoint` | `(endpoint: string) => boolean` | Valida HTTPS ou localhost |

### Exemplo de rejeição

```typescript
import { ServiceGraphQLSecurity } from "tyforge/graphql";

// Introspection — bloqueada
ServiceGraphQLSecurity.isIntrospectionQuery("{ __schema { types { name } } }");
// true — a query será rejeitada automaticamente

// Prototype pollution — sanitizada
const sanitized = ServiceGraphQLSecurity.sanitizeVariables({
  name: "valid",
  __proto__: { admin: true },
  nested: { constructor: "evil", safe: "ok" },
});
// { name: "valid", nested: { safe: "ok" } }

// Endpoint inseguro — rejeitado
ServiceGraphQLSecurity.isSecureEndpoint("http://api.evil.com/graphql");
// false

// Localhost — aceito (desenvolvimento)
ServiceGraphQLSecurity.isSecureEndpoint("http://localhost:4000/graphql");
// true

// HTTPS — aceito
ServiceGraphQLSecurity.isSecureEndpoint("https://api.gateway.com/graphql");
// true
```

## ExceptionGraphQL

`ExceptionGraphQL` estende `Exceptions` (RFC 7807) e fornece factory methods estáticos para cada cenário de erro. Os campos `graphqlErrors` e `operationName` são non-enumerable (não aparecem em `JSON.stringify`).

| Factory Method | Código | Status HTTP | Retriável | Quando |
|---------------|--------|-------------|-----------|--------|
| `queryFailed(operationName, errors)` | `GRAPHQL_QUERY_FAILED` | 502 Bad Gateway | Não | Query retornou erros |
| `mutationFailed(operationName, errors)` | `GRAPHQL_MUTATION_FAILED` | 502 Bad Gateway | Não | Mutation retornou erros |
| `networkError(cause?)` | `GRAPHQL_NETWORK_ERROR` | 502 Bad Gateway | Sim | Endpoint GraphQL inalcançável |
| `unauthorized()` | `GRAPHQL_UNAUTHORIZED` | 401 Unauthorized | Não | `getAuthHeaders()` falhou ou servidor retornou `UNAUTHENTICATED` |
| `timeout(operationName)` | `GRAPHQL_TIMEOUT` | 504 Gateway Timeout | Sim | Timeout atingido |
| `invalidResponse(operationName)` | `GRAPHQL_INVALID_RESPONSE` | 502 Bad Gateway | Não | Resposta sem `data` e sem `errors` |
| `unsafeQuery()` | `GRAPHQL_UNSAFE_QUERY` | 400 Bad Request | Não | Introspection query detectada ou endpoint inseguro |

O campo `retriable` indica se a operação pode ser tentada novamente. `networkError` e `timeout` são retriáveis por padrão.

Quando `queryFailed` ou `mutationFailed` são usados, os erros GraphQL originais ficam acessíveis via `graphqlErrors` (non-enumerable):

```typescript
import { isFailure } from "tyforge/result";

const result = await client.createCharge(5000, "Pedido #123");

if (isFailure(result)) {
  const error = result.error;
  // error.status          → 502
  // error.code            → "GRAPHQL_MUTATION_FAILED"
  // error.retriable       → false
  // error.graphqlErrors   → [{ message: "...", extensions: { code: "..." } }]
  // error.operationName   → "CreateCharge"
}
```

## Detecção automática de UNAUTHENTICATED

O `ServiceGraphQL` detecta automaticamente erros de autenticação nos erros retornados pelo servidor GraphQL. Se qualquer erro na resposta contiver:

- `extensions.code === "UNAUTHENTICATED"`, ou
- `message === "UNAUTHENTICATED"`

A operação retorna `ExceptionGraphQL.unauthorized()` com status `401` em vez de propagar os erros individuais. Isso permite tratamento uniforme de autenticação expirada.

## Extração automática de operationName

O `operationName` é extraído automaticamente do document GraphQL via regex quando não fornecido explicitamente nas opções:

```typescript
// operationName extraído automaticamente: "GetUsers"
this.query(`query GetUsers { users { id name } }`);

// operationName extraído automaticamente: "CreateUser"
this.mutation(`mutation CreateUser($name: String!) { createUser(name: $name) { id } }`);

// operationName fornecido explicitamente nas opções
this.query(`{ users { id } }`, undefined, { operationName: "AnonymousQuery" });
```

## Integração com Result pattern

Toda operação GraphQL retorna `Result` — o código consumidor nunca precisa de try/catch:

```typescript
import { isSuccess, isFailure } from "tyforge/result";

const result = await client.createCharge(5000, "Pedido #123");

if (isSuccess(result)) {
  const data = result.value;
  console.log("Charge created:", data);
}

if (isFailure(result)) {
  const error = result.error;
  if (error.retriable) {
    // pode tentar novamente
  }
}
```

## Pontos de extensão

A classe `ServiceGraphQL` foi projetada para ser estendida. Além de `endpoint` e `getAuthHeaders()`, o código consumidor pode:

- Adicionar métodos tipados para cada operação (queries e mutations)
- Combinar com `IRetryPolicy` e `ICircuitBreaker` da camada de infraestrutura
- Criar wrappers com retry automático baseado no campo `retriable`

```typescript
class ResilientGraphQLClient extends ServiceGraphQL {
  readonly endpoint = "https://api.example.com/graphql";

  protected async getAuthHeaders() {
    return ok({ "X-Api-Key": "secret" });
  }

  async getUsers(): TGraphQLResult<unknown> {
    let lastResult = await this.query(
      `query GetUsers { users { id name email } }`,
      undefined,
      { authenticated: true },
    );

    // Retry se retriable
    for (let attempt = 0; attempt < 2; attempt++) {
      if (isSuccess(lastResult)) return lastResult;
      if (!lastResult.error.retriable) return lastResult;
      lastResult = await this.query(
        `query GetUsers { users { id name email } }`,
        undefined,
        { authenticated: true },
      );
    }
    return lastResult;
  }
}
```
