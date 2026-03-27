---
title: Testes
sidebar_position: 8
---

# Testes

Este guia documenta como escrever, organizar e executar testes no TyForge.

## Como rodar

```bash
npm run test
```

O comando executa `tsx --test src/**/*.test.ts`, utilizando o **test runner nativo do Node.js** (`node:test`). Não há dependência de frameworks externos como Jest ou Mocha.

### Imports necessários

```typescript
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
```

## Estrutura

Os arquivos de teste ficam em diretórios `__tests__/` dentro do módulo correspondente:

```
src/
├── type-fields/
│   └── __tests__/
│       └── currency.test.ts
├── schema/
│   └── __tests__/
│       ├── schema-builder.test.ts
│       ├── schema-domain-models.test.ts
│       ├── schema-stress.test.ts
│       └── batch-parallel-unit.test.ts
├── tools/
│   └── __tests__/
│       └── object-transform.test.ts
├── lint/
│   └── __tests__/
│       └── rules.test.ts
└── examples/
    └── __tests__/
        └── examples.test.ts
```

O padrão de nome é `{descricao}.test.ts`. Os testes são descobertos automaticamente pelo glob `src/**/*.test.ts`.

## Padrão de teste para TypeField

Um teste completo de TypeField deve cobrir todos os cenários de uso da classe. O exemplo abaixo ilustra o padrão para `FFloat`:

```typescript
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { FFloat } from "@tyforge/type-fields/float.format_vo";
import { isSuccess, isFailure } from "@tyforge/result/result";

// ── create ──────────────────────────────────────────────────────

describe("FFloat - create", () => {
  it("accepts valid number", () => {
    const result = FFloat.create(3.14);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), 3.14);
  });

  it("accepts zero", () => {
    const result = FFloat.create(0);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), 0);
  });

  it("accepts negative number", () => {
    const result = FFloat.create(-42.5);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), -42.5);
  });

  it("rejects non-number input", () => {
    const result = FFloat.create<unknown>("abc");
    assert.ok(isFailure(result));
  });

  it("rejects Infinity", () => {
    const result = FFloat.create(Infinity);
    assert.ok(isFailure(result));
  });
});

// ── createOrThrow ───────────────────────────────────────────────

describe("FFloat - createOrThrow", () => {
  it("returns instance for valid value", () => {
    const instance = FFloat.createOrThrow(9.99);
    assert.equal(instance.getValue(), 9.99);
  });

  it("throws for invalid value", () => {
    assert.throws(() => FFloat.createOrThrow(Infinity));
  });
});

// ── assign ──────────────────────────────────────────────────────

describe("FFloat - assign", () => {
  it("accepts valid number from persistence", () => {
    const result = FFloat.assign(100.5);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), 100.5);
  });
});

// ── formatted / toString ────────────────────────────────────────

describe("FFloat - formatting", () => {
  it("formatted returns locale string", () => {
    const instance = FFloat.createOrThrow(1234.56);
    assert.equal(typeof instance.formatted(), "string");
  });

  it("toString returns string representation", () => {
    const instance = FFloat.createOrThrow(3.14);
    assert.equal(instance.toString(), "3.14");
  });
});
```

### Padrão de teste para enum TypeField

Quando o TypeField representa um enum, adicionar cenários de validação dos valores permitidos:

```typescript
import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { FGender, OGender } from "@tyforge/type-fields/gender.format_vo";
import { isSuccess, isFailure } from "@tyforge/result/result";

describe("FGender - create", () => {
  it("accepts valid enum value", () => {
    const result = FGender.create(OGender.MALE);
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), "MALE");
  });

  it("accepts all enum values", () => {
    for (const value of Object.values(OGender)) {
      const result = FGender.create(value);
      assert.ok(isSuccess(result), `Expected success for ${value}`);
    }
  });

  it("rejects value outside enum", () => {
    const result = FGender.create<unknown>("INVALID");
    assert.ok(isFailure(result));
  });

  it("rejects non-string input", () => {
    const result = FGender.create<unknown>(123);
    assert.ok(isFailure(result));
  });
});
```

### Cenários que todo teste de TypeField deve cobrir

| Cenário | Método | Descrição |
|---------|--------|-----------|
| Valor válido | `create` | Verifica que o Result é sucesso e o valor interno está correto |
| Valor inválido | `create` | Verifica que o Result é falha |
| Tipo errado | `create<unknown>` | Passa tipo incompatível e verifica falha |
| Sucesso | `createOrThrow` | Verifica que retorna a instância |
| Falha | `createOrThrow` | Verifica que faz throw |
| Hidratação | `assign` | Verifica que aceita valor vindo da persistência |
| Formatação | `formatted()` | Verifica a representação formatada |
| String | `toString()` | Verifica a representação textual |
| Enum (se aplicável) | `create` | Verifica todos os valores válidos e rejeição de inválidos |

## Helpers de asserção

Para testes com muitas verificações de `Result`, os helpers `assertSuccess` e `assertFailure` simplificam o código e melhoram as mensagens de erro:

```typescript
import type { Result } from "@tyforge/index";

function assertSuccess<T, E>(result: Result<T, E>): asserts result is { success: true; value: T } {
  if (!isSuccess(result)) {
    assert.fail(`Expected success but got failure: ${JSON.stringify(result.error)}`);
  }
}

function assertFailure<T, E>(result: Result<T, E>): asserts result is { success: false; error: E } {
  if (!isFailure(result)) {
    assert.fail("Expected failure but got success");
  }
}
```

Uso:

```typescript
it("creates user with valid data", () => {
  const result = User.create({ name: "Maria", email: "maria@test.com" });
  assertSuccess(result);
  assert.equal(result.value.name.getValue(), "Maria");
});
```

## Exceções controladas em testes

Em código de produção, o uso de `any`, `as` para cast e `unknown` sem narrowing é **proibido**. Porém, arquivos de teste possuem uma concessão controlada: é permitido usar `unknown` e casts em escopo mínimo **exclusivamente** para testar a validação de input inválido.

### Padrão permitido

Usar o genérico `<unknown>` do método `create` para forçar um tipo inválido:

```typescript
// Correto: usa o genérico <unknown> para testar input inválido
it("rejects non-string input", () => {
  const result = FEmail.create<unknown>(12345);
  assert.ok(isFailure(result));
});

it("rejects null input", () => {
  const result = FString.create<unknown>(null);
  assert.ok(isFailure(result));
});
```

### O que continua proibido em testes

- `any` como tipo de variável (usar `unknown`)
- Cast `as` fora do escopo imediato de teste de validação
- `@ts-ignore` / `@ts-expect-error`
- `!` (non-null assertion)

O princípio é: a concessão existe para testar o comportamento da validação com inputs malformados, não para contornar erros de tipo no teste em si.

## Qualidade obrigatória

Antes de qualquer commit, verificar:

```bash
npm run test
```

O resultado deve ser **zero falhas**. Nenhum teste pode ser ignorado com `it.skip` ou `describe.skip` sem justificativa documentada. Testes que dependem de estado externo (rede, banco de dados) devem usar mocks ou stubs.

O comando `npm run test` faz parte do pipeline de pre-commit hooks e será executado automaticamente junto com `npm run typecheck` e `npx tyforge-lint`.
