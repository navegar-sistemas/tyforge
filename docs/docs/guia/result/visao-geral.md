---
title: Result Pattern
sidebar_position: 1
---

# Result Pattern

O TyForge utiliza o **Result pattern** como base para todo tratamento de erros na biblioteca. Em vez de lancar excecoes com `throw`, cada operacao retorna um valor que representa explicitamente sucesso ou falha.

## Por que Result em vez de try/catch?

| Aspecto | try/catch | Result Pattern |
|---------|-----------|----------------|
| **Explicitacao** | Erros sao invisiveis na assinatura da funcao | O tipo de retorno declara que pode falhar |
| **Composicao** | Requer blocos aninhados de try/catch | Composicao funcional com `map`, `flatMap`, `fold` |
| **Seguranca de tipos** | `catch(e)` recebe `unknown` | `Failure<E>` preserva o tipo do erro |
| **Performance** | Stack trace capturado em todo throw | Stack trace lazy — so quando necessario |

## Definicao do tipo

```typescript
type Result<T, E = string> = Success<T> | Failure<E>;

type ResultPromise<T, E> = Promise<Result<T, E>>;

interface Success<T> {
  success: true;
  value: T;
}

interface Failure<E> {
  success: false;
  error: E;
}
```

O tipo `Result<T, E>` e uma **union discriminada** pela propriedade `success`. Quando `success` e `true`, o campo `value` contem o valor do tipo `T`. Quando `success` e `false`, o campo `error` contem o erro do tipo `E`.

O parametro de erro `E` tem default `string`, mas no TyForge e tipicamente `Exceptions` (a classe base de excecoes RFC 7807).

## Uso basico

### Criando Results

```typescript
import { ok, err, isSuccess, isFailure } from "@navegar-sistemas/tyforge";

// Sucesso
const sucesso = ok(42);
// => { success: true, value: 42 }

// Falha
const falha = err("valor invalido");
// => { success: false, error: "valor invalido" }
```

### Verificando o resultado

```typescript
import { FEmail, isSuccess, isFailure } from "@navegar-sistemas/tyforge";

const result = FEmail.create("usuario@email.com");

if (isSuccess(result)) {
  // TypeScript sabe que result.value e FEmail
  console.log(result.value);
}

if (isFailure(result)) {
  // TypeScript sabe que result.error e Exceptions
  console.error(result.error);
}
```

As funcoes `isSuccess` e `isFailure` sao **type guards** — apos a verificacao, o TypeScript restringe o tipo automaticamente dentro do bloco condicional.

## Funcoes utilitarias

### map

Transforma o valor de sucesso sem afetar falhas:

```typescript
import { ok, err, map } from "@navegar-sistemas/tyforge";

map(ok(10), (n) => n * 2);     // => ok(20)
map(err("falha"), (n) => n * 2); // => err("falha")
```

### flatMap

Encadeia operacoes que retornam Result, evitando Result aninhados:

```typescript
import { ok, flatMap } from "@navegar-sistemas/tyforge";

const validarPositivo = (n: number) =>
  n > 0 ? ok(n) : err("deve ser positivo");

flatMap(ok(5), validarPositivo);  // => ok(5)
flatMap(ok(-1), validarPositivo); // => err("deve ser positivo")
```

### fold

Reduz um Result a um unico valor, tratando ambos os casos:

```typescript
import { fold } from "@navegar-sistemas/tyforge";

const mensagem = fold(
  result,
  (value) => `Sucesso: ${value}`,
  (error) => `Erro: ${error}`,
);
```

### match

Similar ao `fold`, mas recebe um objeto com handlers nomeados:

```typescript
import { match } from "@navegar-sistemas/tyforge";

const mensagem = match(result, {
  success: (value) => `Sucesso: ${value}`,
  failure: (error) => `Erro: ${error}`,
});
```

### getOrElse

Extrai o valor de sucesso ou retorna um valor padrao:

```typescript
import { ok, err, getOrElse } from "@navegar-sistemas/tyforge";

getOrElse(ok(42), 0);       // => 42
getOrElse(err("falha"), 0); // => 0

// Tambem aceita uma funcao lazy
getOrElse(err("falha"), () => calcularPadrao());
```

### orElse

Retorna o Result original se for sucesso, ou uma alternativa se for falha:

```typescript
import { ok, err, orElse } from "@navegar-sistemas/tyforge";

orElse(ok(42), ok(0));       // => ok(42)
orElse(err("falha"), ok(0)); // => ok(0)
```

### all

Combina um array de Results em um unico Result com array de valores. Falha no primeiro erro encontrado:

```typescript
import { ok, err, all } from "@navegar-sistemas/tyforge";

all([ok(1), ok(2), ok(3)]); // => ok([1, 2, 3])
all([ok(1), err("x"), ok(3)]); // => err("x")
```

## OK_TRUE — Singleton de validacao

Para validacoes que retornam apenas `true` em caso de sucesso, o TyForge fornece o singleton `OK_TRUE`:

```typescript
export const OK_TRUE: Result<true, never> = Object.freeze({
  success: true as const,
  value: true,
});
```

Como e congelado com `Object.freeze()`, `OK_TRUE` elimina **toda alocacao** no hot path de validacao. Em vez de criar um novo objeto `{ success: true, value: true }` a cada chamada, todos os TypeFields reutilizam a mesma referencia.

Isso e especialmente importante em cenarios de validacao em massa, onde milhares de campos sao validados por segundo.

## Integracao com o restante da biblioteca

O Result pattern permeia toda a biblioteca:

- **TypeFields**: `FString.create()`, `FEmail.create()`, `FInt.create()` — todos retornam `Result<TInstance, Exceptions>`.
- **SchemaBuilder**: `validator.create()` e `validator.assign()` retornam `Result<ISchemaInferProps<T>, Exceptions>`.
- **Domain Models**: `Entity.create()`, `ValueObject.create()` e `Aggregate.create()` retornam Result.

```typescript
import { FEmail, SchemaBuilder, isSuccess } from "@navegar-sistemas/tyforge";
import type { ISchemaInlineObject } from "@navegar-sistemas/tyforge";

// TypeField retorna Result
const emailResult = FEmail.create("usuario@email.com");

// Schema retorna Result
const schema = { email: { type: FEmail, required: true } } satisfies ISchemaInlineObject;
const validator = SchemaBuilder.compile(schema);
const schemaResult = validator.create({ email: "usuario@email.com" });

// Ambos seguem o mesmo padrao
if (isSuccess(emailResult)) { /* ... */ }
if (isSuccess(schemaResult)) { /* ... */ }
```

## Proximos passos

- [API completa do Result](/guia/result/api)
