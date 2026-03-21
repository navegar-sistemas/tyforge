---
title: API Completa
sidebar_position: 2
slug: /result/api
---

# API Completa do Result

Referencia completa de todas as funcoes do modulo Result. O pattern Result encapsula o sucesso ou a falha de uma operacao sem lancar excecoes, garantindo seguranca de tipos em toda a cadeia de chamadas.

## Tipos Fundamentais

```typescript
type Result<T, E = string> = Success<T> | Failure<E>;
type ResultPromise<T, E> = Promise<Result<T, E>>;
```

`Success<T>` possui `{ success: true; value: T }` e `Failure<E>` possui `{ success: false; error: E }`.

---

## Construtores

### `ok`

Cria um Result de sucesso contendo o valor informado.

```typescript
function ok<T>(value: T): Result<T, never>
```

**Exemplo:**

```typescript
import { ok } from '@navegar-sistemas/tyforge';

const resultado = ok(42);
// resultado: { success: true, value: 42 }

const mensagem = ok('Operacao concluida');
// mensagem: { success: true, value: 'Operacao concluida' }
```

---

### `err`

Cria um Result de falha contendo o erro informado.

```typescript
function err<E>(error: E): Result<never, E>
```

**Exemplo:**

```typescript
import { err } from '@navegar-sistemas/tyforge';

const falha = err('Campo obrigatorio ausente');
// falha: { success: false, error: 'Campo obrigatorio ausente' }

const excecao = err(new ExceptionValidation('email', 'E-mail invalido'));
// falha tipada com a excecao
```

---

### `OK_TRUE`

Singleton imutavel (`Object.freeze`) que representa um sucesso com valor `true`. Ideal para validacoes que apenas confirmam sucesso, sem alocar um novo objeto a cada chamada — zero alocacao no hot path.

```typescript
const OK_TRUE: Result<true, never>
```

**Exemplo:**

```typescript
import { OK_TRUE } from '@navegar-sistemas/tyforge';

function validarAtivo(ativo: boolean): Result<true, string> {
  if (!ativo) return err('Usuario inativo');
  return OK_TRUE; // reutiliza o mesmo objeto, sem alocacao
}
```

---

## Type Guards

### `isSuccess`

Type guard que verifica se o Result e um sucesso. Apos a verificacao, o TypeScript estreita o tipo para `Success<T>`, permitindo acessar `.value` com seguranca.

```typescript
function isSuccess<T, E>(result: Result<T, E>): result is Success<T>
```

**Exemplo:**

```typescript
import { ok, err, isSuccess } from '@navegar-sistemas/tyforge';

const resultado = ok('Joao');

if (isSuccess(resultado)) {
  console.log(resultado.value); // 'Joao' — TypeScript sabe que .value existe
}
```

---

### `isFailure`

Type guard que verifica se o Result e uma falha. Apos a verificacao, o TypeScript estreita o tipo para `Failure<E>`, permitindo acessar `.error` com seguranca.

```typescript
function isFailure<T, E>(result: Result<T, E>): result is Failure<E>
```

**Exemplo:**

```typescript
import { err, isFailure } from '@navegar-sistemas/tyforge';

const resultado = err('Dados invalidos');

if (isFailure(resultado)) {
  console.log(resultado.error); // 'Dados invalidos'
}
```

---

## Transformacoes

### `map`

Transforma o valor de sucesso aplicando uma funcao. Se o Result for uma falha, retorna a falha inalterada.

```typescript
function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>
```

**Exemplo:**

```typescript
import { ok, err, map } from '@navegar-sistemas/tyforge';

const numero = ok(5);
const dobro = map(numero, (n) => n * 2);
// dobro: { success: true, value: 10 }

const falha = err('erro');
const tentativa = map(falha, (n: number) => n * 2);
// tentativa: { success: false, error: 'erro' } — funcao nao executada
```

---

### `flatMap`

Encadeia operacoes que retornam Result, evitando `Result<Result<U, E>, E>` aninhados. Se o Result inicial for falha, retorna a falha sem executar a funcao.

```typescript
function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E>
```

**Exemplo:**

```typescript
import { ok, err, flatMap } from '@navegar-sistemas/tyforge';

function parsearIdade(valor: string): Result<number, string> {
  const num = Number(valor);
  return isNaN(num) ? err('Idade invalida') : ok(num);
}

function validarMaiorIdade(idade: number): Result<number, string> {
  return idade >= 18 ? ok(idade) : err('Menor de idade');
}

const resultado = flatMap(parsearIdade('25'), validarMaiorIdade);
// resultado: { success: true, value: 25 }

const falha = flatMap(parsearIdade('abc'), validarMaiorIdade);
// falha: { success: false, error: 'Idade invalida' } — segunda funcao nao executa
```

---

## Reducao e Pattern Matching

### `fold`

Reduz o Result a um unico valor, aplicando uma funcao para o caso de sucesso e outra para o caso de falha. Sempre retorna um valor — nunca retorna um Result.

```typescript
function fold<T, E, R>(
  result: Result<T, E>,
  onSuccess: (value: T) => R,
  onFailure: (error: E) => R,
): R
```

**Exemplo:**

```typescript
import { ok, err, fold } from '@navegar-sistemas/tyforge';

const resultado = ok('Maria');

const mensagem = fold(
  resultado,
  (nome) => `Bem-vinda, ${nome}!`,
  (erro) => `Erro: ${erro}`,
);
// mensagem: 'Bem-vinda, Maria!'

const falha = err('nao encontrado');
const resposta = fold(
  falha,
  (val) => ({ status: 200, body: val }),
  (erro) => ({ status: 400, body: erro }),
);
// resposta: { status: 400, body: 'nao encontrado' }
```

---

### `match`

Pattern matching sobre o Result usando um objeto com handlers `success` e `failure`. Internamente utiliza `fold`.

```typescript
function match<T, E, R>(
  result: Result<T, E>,
  handlers: { success: (value: T) => R; failure: (error: E) => R },
): R
```

**Exemplo:**

```typescript
import { ok, err, match } from '@navegar-sistemas/tyforge';

const resultado = ok(42);

const resposta = match(resultado, {
  success: (valor) => ({ ok: true, data: valor }),
  failure: (erro) => ({ ok: false, mensagem: erro }),
});
// resposta: { ok: true, data: 42 }

const falha = err('timeout');
const respostaFalha = match(falha, {
  success: (valor) => `Valor: ${valor}`,
  failure: (erro) => `Falha: ${erro}`,
});
// respostaFalha: 'Falha: timeout'
```

---

## Fallbacks

### `getOrElse`

Extrai o valor de sucesso ou retorna um valor padrao caso seja falha. Aceita tanto um valor direto quanto uma funcao lazy (avaliada apenas se necessario).

```typescript
function getOrElse<T, E>(
  result: Result<T, E>,
  defaultValue: T | (() => T),
): T
```

**Exemplo:**

```typescript
import { ok, err, getOrElse } from '@navegar-sistemas/tyforge';

const resultado = ok('Joao');
const nome = getOrElse(resultado, 'Anonimo');
// nome: 'Joao'

const falha = err('nao encontrado');
const nomeFallback = getOrElse(falha, 'Anonimo');
// nomeFallback: 'Anonimo'

// Com funcao lazy — util quando o fallback e custoso
const comLazy = getOrElse(falha, () => buscarNomePadrao());
```

---

### `orElse`

Fornece um Result alternativo caso o original seja uma falha. Se o original for sucesso, retorna-o inalterado.

```typescript
function orElse<T, E>(
  result: Result<T, E>,
  alternative: Result<T, E>,
): Result<T, E>
```

**Exemplo:**

```typescript
import { ok, err, orElse } from '@navegar-sistemas/tyforge';

const primario = err('falha no cache');
const secundario = ok('dados do banco');

const final = orElse(primario, secundario);
// final: { success: true, value: 'dados do banco' }

const sucesso = ok('dados do cache');
const resultado = orElse(sucesso, secundario);
// resultado: { success: true, value: 'dados do cache' } — alternativa ignorada
```

---

## Combinacao

### `all`

Combina um array de Results em um unico Result contendo um array de valores. Utiliza short-circuit: retorna imediatamente na primeira falha encontrada, sem processar os demais.

```typescript
function all<T, E>(results: Result<T, E>[]): Result<T[], E>
```

**Exemplo:**

```typescript
import { ok, err, all, isSuccess } from '@navegar-sistemas/tyforge';

const resultados = [ok(1), ok(2), ok(3)];
const combinado = all(resultados);
// combinado: { success: true, value: [1, 2, 3] }

const comFalha = [ok(1), err('invalido'), ok(3)];
const falha = all(comFalha);
// falha: { success: false, error: 'invalido' } — para no segundo item

// Uso pratico: validar multiplos campos
const campos = [
  FString.create(dados.nome, 'nome'),
  FEmail.create(dados.email, 'email'),
  FInt.create(dados.idade, 'idade'),
];
const validacao = all(campos);
if (isSuccess(validacao)) {
  const [nome, email, idade] = validacao.value;
}
```

---

## Conversao

### `toPromise`

Converte um Result para uma Promise. Sucesso vira `Promise.resolve(value)` e falha vira `Promise.reject(error)`. Se o erro nao for uma instancia de `Error`, ele sera convertido automaticamente.

```typescript
function toPromise<T, E>(result: Result<T, E>): Promise<T>
```

**Exemplo:**

```typescript
import { ok, err, toPromise } from '@navegar-sistemas/tyforge';

// Sucesso → resolve
const promessa = toPromise(ok(42));
const valor = await promessa; // 42

// Falha → reject
try {
  await toPromise(err('operacao falhou'));
} catch (e) {
  console.log(e.message); // 'operacao falhou'
}

// Integracao com async/await
async function buscarUsuario(id: string): Promise<Usuario> {
  const resultado = repositorio.findById(id);
  return toPromise(resultado); // converte Result para Promise
}
```
