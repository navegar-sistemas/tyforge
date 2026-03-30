---
title: Schema Builder
sidebar_position: 1
---

# Schema Builder

O `SchemaBuilder` é o motor de validação do TyForge. Ele recebe dados JSON brutos (de APIs, formulários ou qualquer entrada externa) e produz instâncias tipadas de `TypeField`, garantindo que cada campo passou por validação antes de entrar no domínio da aplicação.

## Como Funciona

1. Você define um **schema** — um objeto que descreve os campos, seus tipos e se são obrigatórios.
2. O SchemaBuilder valida cada campo do JSON de entrada usando o método `create` do TypeField correspondente.
3. O resultado é um `Result<Props, Exceptions>` — sucesso com as instâncias tipadas ou falha com o erro de validação.

## Exemplo Básico

```typescript
import { SchemaBuilder, FString, FEmail, FInt, isSuccess } from 'tyforge';
import type { ISchema } from 'tyforge';

const userSchema = {
  name: { type: FString, required: true },
  email: { type: FEmail, required: true },
  age: { type: FInt, required: false },
} satisfies ISchema;

const validator = SchemaBuilder.compile(userSchema);
const result = validator.create({ name: 'João', email: 'joao@email.com', age: 30 });

if (isSuccess(result)) {
  const props = result.value;
  // props.name  -> FString  (instância validada)
  // props.email -> FEmail   (instância validada)
  // props.age   -> FInt | undefined (opcional, pode não estar presente)
}
```

O TypeScript infere automaticamente o tipo de `props` a partir do schema. Campos com `required: false` tornam-se opcionais no tipo resultante.

## Duas APIs Disponíveis

O SchemaBuilder oferece duas formas de uso:

### `compile()` — Recomendado

```typescript
const validator = SchemaBuilder.compile(schema);

// Validação completa (criação)
const resultado = validator.create(dados);

// Validação parcial (atualização)
const resultadoParcial = validator.assign(dados);
```

O método `compile()` pré-analisa o schema uma única vez e retorna um validador otimizado (`ICompiledSchema`). Os campos são convertidos em uma estrutura interna (`CompiledField[]`) que elimina verificações repetidas em cada chamada. **Use esta API para schemas reutilizados muitas vezes** — o custo de compilação é pago uma vez e as validações subsequentes são mais rápidas.

Consulte [Compilação e Modos](/guia/schema/compile) para detalhes completos sobre `create` vs `assign`.

## Inferência de Tipos

O sistema de tipos do TyForge infere automaticamente dois tipos a partir do schema:

- **`InferJson<TSchema>`** — o tipo da entrada JSON (primitivos: `string`, `number`, etc.)
- **`InferProps<TSchema>`** — o tipo da saída validada (instâncias: `FString`, `FEmail`, etc.)

Campos marcados com `required: false` tornam-se propriedades opcionais (`?`) em ambos os tipos.

Consulte [Inferência de Tipos](/guia/schema/tipos) para a referência completa dos tipos utilitários.

## Recursos Suportados

| Recurso | Descrição |
|---|---|
| Campos simples | `{ type: FString, required: true }` |
| Campos opcionais | `{ type: FInt, required: false }` |
| Arrays | `{ type: FString, required: true, isArray: true }` |
| Objetos aninhados | Objetos inline sem wrapper `{ type: ... }` |
| Entidades | `{ type: MinhaEntity, required: true }` |
| Metadados | `expose`, `label`, `description` no campo |

## Tratamento de Erros

O SchemaBuilder retorna `Result<Props, Exceptions>` e nunca lança exceções. Cada erro de validação inclui o **field path** completo para localização precisa:

```typescript
import { SchemaBuilder, FEmail, isFailure } from 'tyforge';
import type { ISchema } from 'tyforge';

const schema = {
  email: { type: FEmail, required: true },
} satisfies ISchema;

const validator = SchemaBuilder.compile(schema);
const result = validator.create({ email: 'inválido' });

if (isFailure(result)) {
  console.log(result.error);
  // ExceptionValidation com field path 'email' e mensagem descritiva
}
```

Para schemas aninhados, o path é composto automaticamente (ex: `user.address.street`), facilitando a identificação do campo exato que falhou.
