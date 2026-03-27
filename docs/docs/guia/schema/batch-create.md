---
title: Batch Create
sidebar_position: 4
---

# batchCreate

Valida múltiplos itens de uma vez, coletando todos os sucessos e falhas separadamente.

## Sequencial (padrão)

```typescript
import { SchemaBuilder, FString, FEmail, FInt } from "tyforge";
import type { ISchema } from "tyforge";

const userSchema = {
  name: { type: FString },
  email: { type: FEmail },
  age: { type: FInt },
} satisfies ISchema;

const validator = SchemaBuilder.compile(userSchema);

const items = [
  { name: "Maria", email: "maria@test.com", age: 28 },
  { name: "", email: "invalid", age: 0 },  // inválido
  { name: "Joao", email: "joao@test.com", age: 30 },
];

const result = validator.batchCreate(items);

console.log(result.ok.length);      // 2 (itens válidos)
console.log(result.errors.length);   // 1 (itens inválidos)
console.log(result.errors[0].index); // 1 (índice original)
```

## Paralelo (worker threads)

:::info Browser / React Native
O modo paralelo (`concurrency > 1`) requer Node.js com `worker_threads`. Em ambientes browser ou React Native, `batchCreate()` faz fallback automático para o modo sequencial — sem erro, sem configuração. O campo `browser` no `package.json` do TyForge cuida dessa troca de forma transparente.
:::

Para grandes volumes de dados (100K+ itens), use worker threads para paralelizar a validação:

```typescript
const items = loadMillionsFromDatabase();

const result = await validator.batchCreate(items, {
  concurrency: 4,       // número de worker threads
  chunkSize: 10_000,    // itens por chunk de worker
});
```

O programador decide quando paralelizar. Sem opções, executa sequencialmente com zero overhead.

### Opções

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `concurrency` | `number` | `1` | Número de worker threads. `1` = sequencial. |
| `chunkSize` | `number` | `10_000` | Itens por chunk de worker. |

### Quando usar paralelo

| Itens | Sequencial | 4 Workers | Recomendação |
|-------|-----------|-----------|--------------|
| < 10K | ~8ms | ~12ms | Sequencial (workers adicionam overhead) |
| 100K | ~80ms | ~25ms | Paralelo (3x mais rápido) |
| 1M | ~800ms | ~220ms | Paralelo (3.6x mais rápido) |
| 10M | ~8s | ~2.2s | Paralelo (3.6x mais rápido) |

### Casos de uso

- **Migração de banco de dados**: validar milhões de registros antes de inserir em novo schema
- **Verificação de consistência**: validar registros existentes contra regras de schema atualizadas
- **Importação em massa**: validar arquivos CSV/JSON com milhares de entradas

### Como funciona

1. A thread principal divide os itens em chunks
2. Cada worker thread recebe um chunk + schema serializado
3. Workers compilam o schema localmente e validam seu chunk
4. Resultados (primitivos + detalhes de erros) são enviados de volta para a thread principal
5. A thread principal reconstroi instancias de TypeField via `assign()`

### Notas importantes

- O modo paralelo retorna uma `Promise` — use `await`
- O modo sequencial (padrão) retorna de forma síncrona
- Cada worker compila o schema independentemente (custo insignificante)
- Worker threads requerem Node.js 24+
- A flag `--expose-gc` é opcional mas recomendada para grandes lotes
