---
title: Moeda
sidebar_position: 7
---

# Type Fields — Moeda

Type Fields monetários encapsulam valores financeiros com precisão inteira (centavos), evitando problemas clássicos de ponto flutuante. Oferecem aritmética, comparações e conversão entre centavos e decimal.

## Resumo

| Classe | Tipo primitivo | Armazenamento | Validação extra | Arquivo |
|--------|---------------|---------------|-----------------|---------|
| `FMoney` | `number` (inteiro) | Centavos | `Number.isInteger()` | `money.format_vo.ts` |
| `FCurrency` | `number` (decimal) | Centavos (converte automaticamente) | Herda de `FMoney` | `currency.format_vo.ts` |

---

## FMoney

Valor monetário armazenado como inteiro em centavos. Evita problemas de precisão de ponto flutuante representando todos os valores na menor unidade da moeda (ex: 1050 = R$ 10,50).

```typescript
import { FMoney } from "tyforge";

const result = FMoney.create(1050);
// Result<FMoney, ExceptionValidation>

const valor = FMoney.createOrThrow(1050);
valor.getValue(); // 1050 (centavos)
valor.toDecimal(); // 10.50
```

### Criação a partir de decimal

```typescript
import { FMoney } from "tyforge";

const result = FMoney.fromDecimal(10.50);
// Internamente converte para 1050 centavos

const valor = FMoney.zero();
valor.getValue(); // 0
valor.isZero();   // true
```

### Aritmética

Todas as operações retornam um novo `FMoney` via `Result`, garantindo imutabilidade:

```typescript
import { FMoney, isSuccess } from "tyforge";

const a = FMoney.createOrThrow(1050); // R$ 10,50
const b = FMoney.createOrThrow(350);  // R$  3,50

const soma = a.add(b);
if (isSuccess(soma)) {
  soma.value.getValue();   // 1400 (R$ 14,00)
  soma.value.toDecimal();  // 14.00
}

const diferenca = a.subtract(b);
if (isSuccess(diferenca)) {
  diferenca.value.getValue();  // 700 (R$ 7,00)
  diferenca.value.toDecimal(); // 7.00
}
```

### Comparações

```typescript
import { FMoney } from "tyforge";

const a = FMoney.createOrThrow(1050);
const b = FMoney.createOrThrow(350);

a.isGreaterThan(b); // true
a.isLessThan(b);    // false
a.isEqualTo(b);     // false
a.isPositive();     // true
a.isNegative();     // false
a.isZero();         // false
```

**Métodos estáticos:**
- `create(cents)` — cria a partir de centavos (inteiro)
- `createOrThrow(cents)` — cria ou lança exceção
- `fromDecimal(value)` — converte valor decimal para centavos (ex: 10.50 -> 1050)
- `zero()` — cria instância com valor zero

**Métodos de instância:**
- `add(other)` — soma centavos e retorna novo `FMoney`
- `subtract(other)` — subtrai centavos e retorna novo `FMoney`
- `toDecimal()` — converte centavos para decimal (ex: 1050 -> 10.50)
- `isZero()`, `isPositive()`, `isNegative()` — verificações de sinal
- `isGreaterThan(other)`, `isLessThan(other)`, `isEqualTo(other)` — comparações

**Regras de validação:**
- Deve ser um número inteiro (`Number.isInteger()`)
- Faixa: `Number.MIN_SAFE_INTEGER` até `Number.MAX_SAFE_INTEGER`

---

## FCurrency

Camada de conveniência sobre `FMoney` que aceita entrada decimal e converte automaticamente para centavos. Ideal para formulários e APIs onde o usuário informa valores com casas decimais.

```typescript
import { FCurrency } from "tyforge";

// Aceita valor decimal, armazena como centavos
const result = FCurrency.create(10.50);
// Result<FCurrency, ExceptionValidation>

const valor = FCurrency.createOrThrow(10.50);
valor.getValue();       // 1050 (centavos internamente)
valor.toDecimalValue(); // 10.50
valor.formatted();      // "10.50"
valor.toString();       // "10.50"
```

### Diferença entre create e assign

```typescript
import { FCurrency } from "tyforge";

// create: aceita valor DECIMAL (10.50 -> 1050 centavos)
const criado = FCurrency.createOrThrow(25.99);
criado.getValue();       // 2599
criado.toDecimalValue(); // 25.99

// assign: aceita CENTAVOS (do banco de dados)
const hidratado = FCurrency.assign(2599);
// hidratado.getValue() -> 2599
```

### Zero

```typescript
import { FCurrency } from "tyforge";

const zero = FCurrency.zero();
zero.getValue();       // 0
zero.toDecimalValue(); // 0
zero.formatted();      // "0.00"
```

**Herança:** `FCurrency` estende `FMoney`, herdando todos os métodos de aritmética (`add`, `subtract`) e comparação (`isGreaterThan`, `isLessThan`, `isEqualTo`, `isZero`, `isPositive`, `isNegative`).

**Regras de validação:**
- Herda todas as regras de `FMoney`
- `create()` recebe decimal e converte para centavos via `Math.round(value * 100)`
- `assign()` recebe centavos diretamente (vindo da persistência)
