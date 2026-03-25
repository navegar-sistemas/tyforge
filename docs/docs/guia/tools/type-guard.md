---
title: TypeGuard
sidebar_position: 2
---

# TypeGuard

O `TypeGuard` e a classe central para verificacao de tipos em tempo de execucao. Ele substitui completamente o uso manual de `typeof`, `instanceof` e verificacoes ad-hoc no projeto.

**Regra do projeto:** nunca use `typeof` diretamente para validacao de tipos primitivos. Use sempre `TypeGuard`.

```typescript
import { TypeGuard } from "tyforge";
```

## Verificacao de tipos

Todos os metodos de verificacao recebem `(value: unknown, fieldPath: string)` e retornam `Result<true, ExceptionValidation>`. A excecao e `isString`, que retorna `Result<string, ExceptionValidation>` com o valor ja trimado.

### isString

Verifica se o valor e uma string, aplica `trim()` e valida comprimento.

```typescript
static isString(
  value: unknown,
  fieldPath: string,
  min?: number,      // padrao: 1
  max?: number,      // padrao: Number.MAX_SAFE_INTEGER
): Result<string, ExceptionValidation>
```

Retorna a string trimada no campo `value` em caso de sucesso:

```typescript
const result = TypeGuard.isString(input, "name", 1, 100);
if (result.success) {
  const trimmed: string = result.value; // string ja sem espacos extras
}
```

### isNumber

Verifica se o valor e um numero valido (nao `NaN`), com limites opcionais e precisao decimal.

```typescript
static isNumber(
  value: unknown,
  fieldPath: string,
  min?: number,              // padrao: Number.MIN_SAFE_INTEGER
  max?: number,              // padrao: Number.MAX_SAFE_INTEGER
  decimalPrecision?: number, // padrao: Infinity
): Result<true, ExceptionValidation>
```

```typescript
const result = TypeGuard.isNumber(price, "price", 0, 99999, 2);
```

### isInteger

Verifica se o valor e um inteiro (`Number.isInteger`), com limites opcionais. Delega para `isNumber` com `decimalPrecision = 0`.

```typescript
static isInteger(
  value: unknown,
  fieldPath: string,
  min?: number,
  max?: number,
): Result<true, ExceptionValidation>
```

### isPositiveInteger / isNegativeInteger

Atalhos para `isInteger` com limites pre-definidos:

```typescript
TypeGuard.isPositiveInteger(value, "count");   // min = 0
TypeGuard.isNegativeInteger(value, "offset");  // max = -1
```

### isPositiveNumber / isNegativeNumber

Atalhos para `isNumber` com limites pre-definidos e precisao decimal opcional:

```typescript
TypeGuard.isPositiveNumber(value, "amount", 2); // min = 0, decimalPrecision = 2
TypeGuard.isNegativeNumber(value, "debt", 2);   // max = -MIN_VALUE
```

### isBoolean

Verifica se o valor e um booleano (`typeof value === "boolean"`).

```typescript
static isBoolean(value: unknown, fieldPath: string): Result<true, ExceptionValidation>
```

### isObject

Verifica se o valor e um objeto nao-nulo e nao-array.

```typescript
static isObject(value: unknown, fieldPath: string): Result<true, ExceptionValidation>
```

### isArray

Verifica se o valor e um array com limites opcionais de tamanho.

```typescript
static isArray(
  value: unknown,
  fieldPath: string,
  min?: number, // padrao: 0
  max?: number, // padrao: Number.MAX_SAFE_INTEGER
): Result<true, ExceptionValidation>
```

### isDate

Verifica se o valor e uma instancia de `Date` valida (`!isNaN(date.getTime())`).

```typescript
static isDate(value: unknown, fieldPath: string): Result<true, ExceptionValidation>
```

### isFunction

Verifica se o valor e uma funcao.

```typescript
static isFunction(value: unknown, fieldPath: string): Result<true, ExceptionValidation>
```

### isNull / isUndefined

Verificam se o valor e exatamente `null` ou `undefined`.

```typescript
static isNull(value: unknown, fieldPath: string): Result<true, ExceptionValidation>
static isUndefined(value: unknown, fieldPath: string): Result<true, ExceptionValidation>
```

### isRegExp / isSymbol / isBigInt / isSet / isMap

Verificacoes para tipos especializados:

```typescript
static isRegExp(value: unknown, fieldPath: string): Result<true, ExceptionValidation>
static isSymbol(value: unknown, fieldPath: string): Result<true, ExceptionValidation>
static isBigInt(value: unknown, fieldPath: string): Result<true, ExceptionValidation>
static isSet(value: unknown, fieldPath: string): Result<true, ExceptionValidation>
static isMap(value: unknown, fieldPath: string): Result<true, ExceptionValidation>
```

## Type narrowing

Metodos que funcionam como type guards nativos do TypeScript (retornam `boolean` com narrowing):

### isRecord

Verifica se o valor e um `Record<string, unknown>`. Funciona como type guard para narrowing:

```typescript
static isRecord(value: unknown): value is Record<string, unknown>
```

```typescript
if (TypeGuard.isRecord(data)) {
  // TypeScript sabe que data e Record<string, unknown>
  const name = data["name"];
}
```

### isCallable

Verifica se o valor e uma funcao. Funciona como type guard:

```typescript
static isCallable(value: unknown): value is Function
```

```typescript
if (TypeGuard.isCallable(handler)) {
  handler(); // TypeScript sabe que handler e Function
}
```

## Extracao de valores

Metodos que retornam `Result<T, ExceptionValidation>` com o valor tipado, nao apenas `Result<true>`. Uteis quando voce precisa do valor extraido apos a validacao.

### extractBoolean

Extrai um booleano, retornando o valor tipado:

```typescript
static extractBoolean(value: unknown, fieldPath: string): Result<boolean, ExceptionValidation>
```

```typescript
const result = TypeGuard.extractBoolean(input, "active");
if (result.success) {
  const active: boolean = result.value;
}
```

### extractArray

Extrai um array com limites opcionais de tamanho:

```typescript
static extractArray(
  value: unknown,
  fieldPath: string,
  min?: number,
  max?: number,
): Result<unknown[], ExceptionValidation>
```

```typescript
const result = TypeGuard.extractArray(input, "tags", 1, 10);
if (result.success) {
  const tags: unknown[] = result.value;
}
```

### extractNumber

Extrai um numero com limites opcionais:

```typescript
static extractNumber(
  value: unknown,
  fieldPath: string,
  min?: number,
  max?: number,
): Result<number, ExceptionValidation>
```

```typescript
const result = TypeGuard.extractNumber(input, "age", 0, 150);
if (result.success) {
  const age: number = result.value;
}
```

## Validacao de enum

### isEnumKey

Verifica se um valor e uma **chave** valida de um objeto enum:

```typescript
static isEnumKey<T extends object>(
  enumObj: T,
  value: string | number,
  fieldPath: string,
): Result<true, ExceptionValidation>
```

```typescript
const OStatus = { ACTIVE: "active", INACTIVE: "inactive" } as const;

TypeGuard.isEnumKey(OStatus, "ACTIVE", "status");   // ok(true)
TypeGuard.isEnumKey(OStatus, "active", "status");    // err(...)
```

### isEnumValue

Verifica se um valor e um **valor** valido de um objeto enum:

```typescript
static isEnumValue<T extends object>(
  enumObj: T,
  value: string | number,
  fieldPath: string,
): Result<true, ExceptionValidation>
```

```typescript
const OStatus = { ACTIVE: "active", INACTIVE: "inactive" } as const;

TypeGuard.isEnumValue(OStatus, "active", "status");  // ok(true)
TypeGuard.isEnumValue(OStatus, "ACTIVE", "status");   // err(...)
```

## Utilitarios

### isEmpty

Verifica se um valor esta "vazio". Suporta multiplos tipos:

```typescript
static isEmpty(value: unknown): boolean
```

| Tipo | Considerado vazio |
|------|-------------------|
| `null`, `undefined` | Sempre |
| `string` | Apos `trim()`, se o comprimento for 0 |
| `Array` | Se `length === 0` |
| `Set`, `Map` | Se `size === 0` |
| `object` | Se nao possui chaves proprias |

```typescript
TypeGuard.isEmpty(null);        // true
TypeGuard.isEmpty("");          // true
TypeGuard.isEmpty("  ");        // true
TypeGuard.isEmpty([]);          // true
TypeGuard.isEmpty({});          // true
TypeGuard.isEmpty(new Set());   // true
TypeGuard.isEmpty("hello");     // false
TypeGuard.isEmpty([1]);         // false
```

### isHex

Verifica se o valor e um hexadecimal com prefixo `0x`, com comprimento de digitos util opcional:

```typescript
static isHex(
  value: unknown,
  fieldPath: string,
  length?: number, // digitos uteis (sem contar "0x")
): Result<true, ExceptionValidation>
```

```typescript
TypeGuard.isHex("0x1a2b", "hash");         // ok(true)
TypeGuard.isHex("0x1a2b", "hash", 4);      // ok(true) — 4 digitos
TypeGuard.isHex("0x1a2b", "hash", 8);      // err(...) — esperava 8
TypeGuard.isHex("hello", "hash");           // err(...)
```

## Resumo de assinaturas

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `isString` | `Result<string>` | String trimada com limites de comprimento |
| `isNumber` | `Result<true>` | Numero com faixa e precisao decimal |
| `isInteger` | `Result<true>` | Inteiro com faixa |
| `isPositiveInteger` | `Result<true>` | Inteiro >= 0 |
| `isNegativeInteger` | `Result<true>` | Inteiro <= -1 |
| `isPositiveNumber` | `Result<true>` | Numero >= 0 com precisao |
| `isNegativeNumber` | `Result<true>` | Numero < 0 com precisao |
| `isBoolean` | `Result<true>` | Booleano |
| `isObject` | `Result<true>` | Objeto nao-nulo, nao-array |
| `isArray` | `Result<true>` | Array com limites de tamanho |
| `isDate` | `Result<true>` | Date valido |
| `isFunction` | `Result<true>` | Funcao |
| `isNull` | `Result<true>` | Exatamente null |
| `isUndefined` | `Result<true>` | Exatamente undefined |
| `isRegExp` | `Result<true>` | Expressao regular |
| `isSymbol` | `Result<true>` | Symbol |
| `isBigInt` | `Result<true>` | BigInt |
| `isSet` | `Result<true>` | Set |
| `isMap` | `Result<true>` | Map |
| `isRecord` | `value is Record` | Type guard para Record |
| `isCallable` | `value is Function` | Type guard para Function |
| `extractBoolean` | `Result<boolean>` | Extrai booleano tipado |
| `extractArray` | `Result<unknown[]>` | Extrai array tipado |
| `extractNumber` | `Result<number>` | Extrai numero tipado |
| `isEnumKey` | `Result<true>` | Chave de enum |
| `isEnumValue` | `Result<true>` | Valor de enum |
| `isEmpty` | `boolean` | Verificacao de vazio |
| `isHex` | `Result<true>` | Hexadecimal com prefixo 0x |
