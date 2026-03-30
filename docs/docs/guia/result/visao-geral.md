---
title: Result Pattern
sidebar_position: 1
---

# Result Pattern

O TyForge utiliza o **Result pattern** como base para todo tratamento de erros no framework. Em vez de lançar exceções com `throw`, cada operação retorna um valor que representa explicitamente sucesso ou falha.

## Por que Result em vez de try/catch?

| Aspecto | try/catch | Result Pattern |
|---------|-----------|----------------|
| **Explicitação** | Erros são invisíveis na assinatura da função | O tipo de retorno declara que pode falhar |
| **Composição** | Requer blocos aninhados de try/catch | Composição funcional com `map`, `flatMap`, `fold` |
| **Segurança de tipos** | `catch(e)` recebe `unknown` | `Failure<E>` preserva o tipo do erro |
| **Performance** | Stack trace capturado em todo throw | Stack trace lazy — só quando necessário |

## Definição do tipo

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

O tipo `Result<T, E>` é uma **union discriminada** pela propriedade `success`. Quando `success` é `true`, o campo `value` contém o valor do tipo `T`. Quando `success` é `false`, o campo `error` contém o erro do tipo `E`.

O parâmetro de erro `E` tem default `string`, mas no TyForge é tipicamente `Exceptions` (a classe base de exceções RFC 7807).

## Uso básico

### Criando Results

```typescript
import { ok, err, isSuccess, isFailure } from "tyforge";

// Sucesso
const sucesso = ok(42);
// => { success: true, value: 42 }

// Falha
const falha = err("valor inválido");
// => { success: false, error: "valor inválido" }
```

### Verificando o resultado

```typescript
import { FEmail, isSuccess, isFailure } from "tyforge";

const result = FEmail.create("usuario@email.com");

if (isSuccess(result)) {
  // TypeScript sabe que result.value é FEmail
  console.log(result.value);
}

if (isFailure(result)) {
  // TypeScript sabe que result.error é Exceptions
  console.error(result.error);
}
```

As funções `isSuccess` e `isFailure` são **type guards** — após a verificação, o TypeScript restringe o tipo automaticamente dentro do bloco condicional.

## Funções utilitárias

### map

Transforma o valor de sucesso sem afetar falhas:

```typescript
import { ok, err, map } from "tyforge";

map(ok(10), (n) => n * 2);     // => ok(20)
map(err("falha"), (n) => n * 2); // => err("falha")
```

### flatMap

Encadeia operações que retornam Result, evitando Result aninhados:

```typescript
import { ok, flatMap } from "tyforge";

const validarPositivo = (n: number) =>
  n > 0 ? ok(n) : err("deve ser positivo");

flatMap(ok(5), validarPositivo);  // => ok(5)
flatMap(ok(-1), validarPositivo); // => err("deve ser positivo")
```

### fold

Reduz um Result a um único valor, tratando ambos os casos:

```typescript
import { fold } from "tyforge";

const mensagem = fold(
  result,
  (value) => `Sucesso: ${value}`,
  (error) => `Erro: ${error}`,
);
```

### match

Similar ao `fold`, mas recebe um objeto com handlers nomeados:

```typescript
import { match } from "tyforge";

const mensagem = match(result, {
  success: (value) => `Sucesso: ${value}`,
  failure: (error) => `Erro: ${error}`,
});
```

### getOrElse

Extrai o valor de sucesso ou retorna um valor padrão:

```typescript
import { ok, err, getOrElse } from "tyforge";

getOrElse(ok(42), 0);       // => 42
getOrElse(err("falha"), 0); // => 0

// Também aceita uma função lazy
getOrElse(err("falha"), () => calcularPadrão());
```

### orElse

Retorna o Result original se for sucesso, ou uma alternativa se for falha:

```typescript
import { ok, err, orElse } from "tyforge";

orElse(ok(42), ok(0));       // => ok(42)
orElse(err("falha"), ok(0)); // => ok(0)
```

### all

Combina um array de Results em um único Result com array de valores. Falha no primeiro erro encontrado:

```typescript
import { ok, err, all } from "tyforge";

all([ok(1), ok(2), ok(3)]); // => ok([1, 2, 3])
all([ok(1), err("x"), ok(3)]); // => err("x")
```

## OK_TRUE — Singleton de validação

Para validações que retornam apenas `true` em caso de sucesso, o TyForge fornece o singleton `OK_TRUE`:

```typescript
export const OK_TRUE: Result<true, never> = Object.freeze({
  success: true as const,
  value: true,
});
```

Como é congelado com `Object.freeze()`, `OK_TRUE` elimina **toda alocação** no hot path de validação. Em vez de criar um novo objeto `{ success: true, value: true }` a cada chamada, todos os TypeFields reutilizam a mesma referência.

Isso é especialmente importante em cenários de validação em massa, onde milhares de campos são validados por segundo.

## Integração com o restante do framework

O Result pattern permeia todo o framework:

- **TypeFields**: `FString.create()`, `FEmail.create()`, `FInt.create()` — todos retornam `Result<TInstance, Exceptions>`.
- **SchemaBuilder**: `validator.create()` e `validator.assign()` retornam `Result<InferProps<T>, Exceptions>`.
- **Domain Models**: `Entity.create()`, `ValueObject.create()` e `Aggregate.create()` retornam Result.

```typescript
import { FEmail, SchemaBuilder, isSuccess } from "tyforge";
import type { ISchema } from "tyforge";

// TypeField retorna Result
const emailResult = FEmail.create("usuario@email.com");

// Schema retorna Result
const schema = { email: { type: FEmail, required: true } } satisfies ISchema;
const validator = SchemaBuilder.compile(schema);
const schemaResult = validator.create({ email: "usuario@email.com" });

// Ambos seguem o mesmo padrão
if (isSuccess(emailResult)) { /* ... */ }
if (isSuccess(schemaResult)) { /* ... */ }
```

## Próximos passos

- [API completa do Result](/guia/result/api)
