---
title: Schema Builder
sidebar_position: 1
---

# Schema Builder

O `SchemaBuilder` e o motor de validacao do TyForge. Ele recebe dados JSON brutos (de APIs, formularios ou qualquer entrada externa) e produz instancias tipadas de `TypeField`, garantindo que cada campo passou por validacao antes de entrar no dominio da aplicacao.

## Como Funciona

1. Voce define um **schema** — um objeto que descreve os campos, seus tipos e se sao obrigatorios.
2. O SchemaBuilder valida cada campo do JSON de entrada usando o metodo `create` do TypeField correspondente.
3. O resultado e um `Result<Props, Exceptions>` — sucesso com as instancias tipadas ou falha com o erro de validacao.

## Exemplo Basico

```typescript
import { SchemaBuilder, FString, FEmail, FInt, isSuccess } from 'tyforge';
import type { Schema } from 'tyforge';

const userSchema = {
  name: { type: FString, required: true },
  email: { type: FEmail, required: true },
  age: { type: FInt, required: false },
} satisfies Schema;

const validator = SchemaBuilder.compile(userSchema);
const result = validator.create({ name: 'Joao', email: 'joao@email.com', age: 30 });

if (isSuccess(result)) {
  const props = result.value;
  // props.name  -> FString  (instancia validada)
  // props.email -> FEmail   (instancia validada)
  // props.age   -> FInt | undefined (opcional, pode nao estar presente)
}
```

O TypeScript infere automaticamente o tipo de `props` a partir do schema. Campos com `required: false` tornam-se opcionais no tipo resultante.

## Duas APIs Disponiveis

O SchemaBuilder oferece duas formas de uso:

### `compile()` — Recomendado

```typescript
const validator = SchemaBuilder.compile(schema);

// Validacao completa (criacao)
const resultado = validator.create(dados);

// Validacao parcial (atualizacao)
const resultadoParcial = validator.assign(dados);
```

O metodo `compile()` pre-analisa o schema uma unica vez e retorna um validador otimizado (`CompiledSchema`). Os campos sao convertidos em uma estrutura interna (`CompiledField[]`) que elimina verificacoes repetidas em cada chamada. **Use esta API para schemas reutilizados muitas vezes** — o custo de compilacao e pago uma vez e as validacoes subsequentes sao mais rapidas.

Consulte [Compilacao e Modos](/guia/schema/compile) para detalhes completos sobre `create` vs `assign`.

## Inferencia de Tipos

O sistema de tipos do TyForge infere automaticamente dois tipos a partir do schema:

- **`InferJson<TSchema>`** — o tipo da entrada JSON (primitivos: `string`, `number`, etc.)
- **`InferProps<TSchema>`** — o tipo da saida validada (instancias: `FString`, `FEmail`, etc.)

Campos marcados com `required: false` tornam-se propriedades opcionais (`?`) em ambos os tipos.

Consulte [Inferencia de Tipos](/guia/schema/tipos) para a referencia completa dos tipos utilitarios.

## Recursos Suportados

| Recurso | Descricao |
|---|---|
| Campos simples | `{ type: FString, required: true }` |
| Campos opcionais | `{ type: FInt, required: false }` |
| Arrays | `{ type: FString, required: true, isArray: true }` |
| Objetos aninhados | Objetos inline sem wrapper `{ type: ... }` |
| Entidades | `{ type: MinhaEntity, required: true }` |
| Metadados | `expose`, `label`, `description` no campo |

## Tratamento de Erros

O SchemaBuilder retorna `Result<Props, Exceptions>` e nunca lanca excecoes. Cada erro de validacao inclui o **field path** completo para localizacao precisa:

```typescript
import { SchemaBuilder, FEmail, isFailure } from 'tyforge';
import type { Schema } from 'tyforge';

const schema = {
  email: { type: FEmail, required: true },
} satisfies Schema;

const validator = SchemaBuilder.compile(schema);
const result = validator.create({ email: 'invalido' });

if (isFailure(result)) {
  console.log(result.error);
  // ExceptionValidation com field path 'email' e mensagem descritiva
}
```

Para schemas aninhados, o path e composto automaticamente (ex: `user.address.street`), facilitando a identificacao do campo exato que falhou.
