---
title: Numericos
sidebar_position: 3
---

# Type Fields — Numericos

Type Fields numericos encapsulam e validam valores inteiros com regras de faixa, precisao e enumeracao.

## Resumo

| Classe | Min | Max | Decimal | Validacao extra | Arquivo |
|--------|-----|-----|---------|-----------------|---------|
| `FInt` | -2147483648 | 2147483647 | 0 | `Number.isInteger()` | `int.format_vo.ts` |
| `FPageNumber` | 1 | `MAX_SAFE_INTEGER` | 0 | Inteiro >= 1 | `page-number.format_vo.ts` |
| `FPageSize` | 1 | 100 | 0 | Inteiro entre 1 e 100 | `page-size.format_vo.ts` |
| `FBoolInt` | 0 | 1 | 0 | Enum `OBoolInt` (0 ou 1) | `bool-int.format_vo.ts` |

---

## FInt

Numero inteiro generico sem casas decimais. Cobre a faixa completa de inteiros de 32 bits.

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

**Regras de validacao:**
- Deve ser um numero valido dentro da faixa de inteiro 32-bit
- Deve ser inteiro (`Number.isInteger()`) — valores decimais sao rejeitados

---

## FPageNumber

Numero de pagina para paginacao. Garante que a pagina seja sempre >= 1.

```typescript
import { FPageNumber } from "tyforge";

const result = FPageNumber.create(1);
// Result<FPageNumber, ExceptionValidation>

const pagina = FPageNumber.createOrThrow(3);
pagina.getValue(); // 3
```

**Regras de validacao:**
- Deve ser um inteiro >= 1
- Maximo: `Number.MAX_SAFE_INTEGER`

---

## FPageSize

Tamanho da pagina para paginacao. Limita a quantidade de itens por pagina entre 1 e 100.

```typescript
import { FPageSize } from "tyforge";

const result = FPageSize.create(20);
// Result<FPageSize, ExceptionValidation>

const tamanho = FPageSize.createOrThrow(50);
tamanho.getValue(); // 50
```

**Regras de validacao:**
- Deve ser um inteiro entre 1 e 100
- Valores maiores que 100 sao rejeitados para evitar consultas excessivas

---

## FBoolInt

Valor booleano codificado como inteiro. Utiliza o enum `OBoolInt` para validacao.

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

**Regras de validacao:**
- Aceita apenas os valores do enum: `0` (INVALIDO) ou `1` (VALIDO)
- Qualquer outro valor numerico e rejeitado
