---
title: Numéricos
sidebar_position: 3
---

# Type Fields — Numéricos

Type Fields numéricos encapsulam e validam valores inteiros com regras de faixa, precisão e enumeração.

## Resumo

| Classe | Min | Max | Decimal | Validação extra | Arquivo |
|--------|-----|-----|---------|-----------------|---------|
| `FInt` | -2147483648 | 2147483647 | 0 | `Number.isInteger()` | `int.format_vo.ts` |
| `FPageNumber` | 1 | `MAX_SAFE_INTEGER` | 0 | Inteiro >= 1 | `page-number.format_vo.ts` |
| `FPageSize` | 1 | 100 | 0 | Inteiro entre 1 e 100 | `page-size.format_vo.ts` |
| `FFloat` | `MIN_SAFE_INTEGER` | `MAX_SAFE_INTEGER` | 10 | `Number.isFinite()` | `float.format_vo.ts` |
| `FBoolInt` | 0 | 1 | 0 | Enum `OBoolInt` (0 ou 1) | `bool-int.format_vo.ts` |

---

## FInt

Número inteiro genérico sem casas decimais. Cobre a faixa completa de inteiros de 32 bits.

```typescript
import { FInt } from "tyforge";

const result = FInt.create(42);
// Result<FInt, ExceptionValidation>

const numero = FInt.createOrThrow(42);
numero.getValue(); // 42
numero.toString(); // "42"
```

**Config:**

```typescript
{
  jsonSchemaType: "number",
  min: -2147483648,
  max: 2147483647,
  decimalPrecision: 0,
}
```

**Regras de validação:**
- Deve ser um número válido dentro da faixa de inteiro 32-bit
- Deve ser inteiro (`Number.isInteger()`) — valores decimais são rejeitados

---

## FPageNumber

Número de página para paginação. Garante que a página seja sempre >= 1.

```typescript
import { FPageNumber } from "tyforge";

const result = FPageNumber.create(1);
// Result<FPageNumber, ExceptionValidation>

const pagina = FPageNumber.createOrThrow(3);
pagina.getValue(); // 3
```

**Regras de validação:**
- Deve ser um inteiro >= 1
- Máximo: `Number.MAX_SAFE_INTEGER`

---

## FPageSize

Tamanho da página para paginação. Limita a quantidade de itens por página entre 1 e 100.

```typescript
import { FPageSize } from "tyforge";

const result = FPageSize.create(20);
// Result<FPageSize, ExceptionValidation>

const tamanho = FPageSize.createOrThrow(50);
tamanho.getValue(); // 50
```

**Regras de validação:**
- Deve ser um inteiro entre 1 e 100
- Valores maiores que 100 são rejeitados para evitar consultas excessivas

---

## FFloat

Número decimal genérico. Aceita qualquer valor numérico finito dentro da faixa de inteiros seguros do JavaScript (`Number.MIN_SAFE_INTEGER` a `Number.MAX_SAFE_INTEGER`), com até 10 casas decimais.

```typescript
import { FFloat } from "tyforge";

const result = FFloat.create(3.14);
// Result<FFloat, ExceptionValidation>

const preco = FFloat.createOrThrow(99.90);
preco.getValue(); // 99.9
preco.toString(); // "99.9"
```

**Config:**

```typescript
{
  jsonSchemaType: "number",
  min: Number.MIN_SAFE_INTEGER,
  max: Number.MAX_SAFE_INTEGER,
  decimalPrecision: 10,
}
```

**Regras de validação:**
- Deve ser um número válido dentro da faixa de `MIN_SAFE_INTEGER` a `MAX_SAFE_INTEGER`
- Deve ser um número finito (`Number.isFinite()`) — `Infinity`, `-Infinity` e `NaN` são rejeitados
- Aceita até 10 casas decimais

---

## FBoolInt

Valor booleano codificado como inteiro. Utiliza o enum `OBoolInt` para validação.

```typescript
import { FBoolInt, OBoolInt } from "tyforge";

const result = FBoolInt.create(OBoolInt.VALIDO);
// Result<FBoolInt, ExceptionValidation>

const flag = FBoolInt.createOrThrow(1);
flag.getValue(); // 1

const invalido = FBoolInt.createOrThrow(OBoolInt.INVALIDO);
invalido.getValue(); // 0
```

### Constante `OBoolInt`

```typescript
export const OBoolInt = {
  INVALIDO: 0,
  VALIDO: 1,
} as const;
```

### Tipos relacionados

```typescript
export type TKeyBoolInt = keyof typeof OBoolInt;  // "INVALIDO" | "VALIDO"
export type TBoolInt = (typeof OBoolInt)[TKeyBoolInt]; // 0 | 1
```

**Regras de validação:**
- Aceita apenas os valores do enum: `0` (INVALIDO) ou `1` (VALIDO)
- Qualquer outro valor numérico é rejeitado
