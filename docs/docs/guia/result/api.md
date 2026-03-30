---
title: API Completa
sidebar_position: 2
---

# API Completa do Result

Referência completa de todas as funções do módulo Result. O pattern Result encapsula o sucesso ou a falha de uma operação sem lançar exceções, garantindo segurança de tipos em toda a cadeia de chamadas.

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
import { ok } from 'tyforge';

const resultado = ok(42);
// resultado: { success: true, value: 42 }

const mensagem = ok('Operação concluída');
// mensagem: { success: true, value: 'Operação concluída' }
```

---

### `err`

Cria um Result de falha contendo o erro informado.

```typescript
function err<E>(error: E): Result<never, E>
```

**Exemplo:**

```typescript
import { err } from 'tyforge';

const falha = err('Campo obrigatório ausente');
// falha: { success: false, error: 'Campo obrigatório ausente' }

const excecao = err(new ExceptionValidation('email', 'E-mail inválido'));
// falha tipada com a exceção
```

---

### `OK_TRUE`

Singleton imutável (`Object.freeze`) que representa um sucesso com valor `true`. Ideal para validações que apenas confirmam sucesso, sem alocar um novo objeto a cada chamada — zero alocação no hot path.

```typescript
const OK_TRUE: Result<true, never>
```

**Exemplo:**

```typescript
import { OK_TRUE } from 'tyforge';

function validarAtivo(ativo: boolean): Result<true, string> {
  if (!ativo) return err('Usuário inativo');
  return OK_TRUE; // reutiliza o mesmo objeto, sem alocação
}
```

---

## Type Guards

### `isSuccess`

Type guard que verifica se o Result é um sucesso. Após a verificação, o TypeScript estreita o tipo para `Success<T>`, permitindo acessar `.value` com segurança.

```typescript
function isSuccess<T, E>(result: Result<T, E>): result is Success<T>
```

**Exemplo:**

```typescript
import { ok, err, isSuccess } from 'tyforge';

const resultado = ok('João');

if (isSuccess(resultado)) {
  console.log(resultado.value); // 'João' — TypeScript sabe que .value existe
}
```

---

### `isFailure`

Type guard que verifica se o Result é uma falha. Após a verificação, o TypeScript estreita o tipo para `Failure<E>`, permitindo acessar `.error` com segurança.

```typescript
function isFailure<T, E>(result: Result<T, E>): result is Failure<E>
```

**Exemplo:**

```typescript
import { err, isFailure } from 'tyforge';

const resultado = err('Dados inválidos');

if (isFailure(resultado)) {
  console.log(resultado.error); // 'Dados inválidos'
}
```

---

## Transformações

### `map`

Transforma o valor de sucesso aplicando uma função. Se o Result for uma falha, retorna a falha inalterada.

```typescript
function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>
```

**Exemplo:**

```typescript
import { ok, err, map } from 'tyforge';

const numero = ok(5);
const dobro = map(numero, (n) => n * 2);
// dobro: { success: true, value: 10 }

const falha = err('erro');
const tentativa = map(falha, (n: number) => n * 2);
// tentativa: { success: false, error: 'erro' } — função não executada
```

---

### `flatMap`

Encadeia operações que retornam Result, evitando `Result<Result<U, E>, E>` aninhados. Se o Result inicial for falha, retorna a falha sem executar a função.

```typescript
function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E>
```

**Exemplo:**

```typescript
import { ok, err, flatMap } from 'tyforge';

function parsearIdade(valor: string): Result<number, string> {
  const num = Number(valor);
  return isNaN(num) ? err('Idade inválida') : ok(num);
}

function validarMaiorIdade(idade: number): Result<number, string> {
  return idade >= 18 ? ok(idade) : err('Menor de idade');
}

const resultado = flatMap(parsearIdade('25'), validarMaiorIdade);
// resultado: { success: true, value: 25 }

const falha = flatMap(parsearIdade('abc'), validarMaiorIdade);
// falha: { success: false, error: 'Idade inválida' } — segunda função não executa
```

---

## Redução e Pattern Matching

### `fold`

Reduz o Result a um único valor, aplicando uma função para o caso de sucesso e outra para o caso de falha. Sempre retorna um valor — nunca retorna um Result.

```typescript
function fold<T, E, R>(
  result: Result<T, E>,
  onSuccess: (value: T) => R,
  onFailure: (error: E) => R,
): R
```

**Exemplo:**

```typescript
import { ok, err, fold } from 'tyforge';

const resultado = ok('Maria');

const mensagem = fold(
  resultado,
  (nome) => `Bem-vinda, ${nome}!`,
  (erro) => `Erro: ${erro}`,
);
// mensagem: 'Bem-vinda, Maria!'

const falha = err('não encontrado');
const resposta = fold(
  falha,
  (val) => ({ status: 200, body: val }),
  (erro) => ({ status: 400, body: erro }),
);
// resposta: { status: 400, body: 'não encontrado' }
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
import { ok, err, match } from 'tyforge';

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

Extrai o valor de sucesso ou retorna um valor padrão caso seja falha. Aceita tanto um valor direto quanto uma função lazy (avaliada apenas se necessário).

```typescript
function getOrElse<T, E>(
  result: Result<T, E>,
  defaultValue: T | (() => T),
): T
```

**Exemplo:**

```typescript
import { ok, err, getOrElse } from 'tyforge';

const resultado = ok('João');
const nome = getOrElse(resultado, 'Anônimo');
// nome: 'João'

const falha = err('não encontrado');
const nomeFallback = getOrElse(falha, 'Anônimo');
// nomeFallback: 'Anônimo'

// Com função lazy — útil quando o fallback é custoso
const comLazy = getOrElse(falha, () => buscarNomePadrão());
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
import { ok, err, orElse } from 'tyforge';

const primario = err('falha no cache');
const secundario = ok('dados do banco');

const final = orElse(primario, secundario);
// final: { success: true, value: 'dados do banco' }

const sucesso = ok('dados do cache');
const resultado = orElse(sucesso, secundario);
// resultado: { success: true, value: 'dados do cache' } — alternativa ignorada
```

---

## Combinação

### `all`

Combina um array de Results em um único Result contendo um array de valores. Utiliza short-circuit: retorna imediatamente na primeira falha encontrada, sem processar os demais.

```typescript
function all<T, E>(results: Result<T, E>[]): Result<T[], E>
```

**Exemplo:**

```typescript
import { ok, err, all, isSuccess } from 'tyforge';

const resultados = [ok(1), ok(2), ok(3)];
const combinado = all(resultados);
// combinado: { success: true, value: [1, 2, 3] }

const comFalha = [ok(1), err('inválido'), ok(3)];
const falha = all(comFalha);
// falha: { success: false, error: 'inválido' } — para no segundo item

// Uso prático: validar múltiplos campos
const campos = [
  FString.create(dados.nome, 'nome'),
  FEmail.create(dados.email, 'email'),
  FInt.create(dados.idade, 'idade'),
];
const validação = all(campos);
if (isSuccess(validação)) {
  const [nome, email, idade] = validação.value;
}
```

---

## Conversão

### `toPromise`

Converte um Result para uma Promise. Sucesso vira `Promise.resolve(value)` e falha vira `Promise.reject(error)`. Se o erro não for uma instância de `Error`, ele será convertido automaticamente.

```typescript
function toPromise<T, E>(result: Result<T, E>): Promise<T>
```

**Exemplo:**

```typescript
import { ok, err, toPromise } from 'tyforge';

// Sucesso → resolve
const promessa = toPromise(ok(42));
const valor = await promessa; // 42

// Falha → reject
try {
  await toPromise(err('operação falhou'));
} catch (e) {
  console.log(e.message); // 'operação falhou'
}

// Integração com async/await
async function buscarUsuario(id: string): Promise<Usuario> {
  const resultado = repositorio.findById(id);
  return toPromise(resultado); // converte Result para Promise
}
```
