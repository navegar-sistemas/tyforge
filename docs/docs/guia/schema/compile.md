---
title: Compilação e Modos
sidebar_position: 2
---

# Compilação e Modos

O método `SchemaBuilder.compile()` é a forma recomendada de usar o SchemaBuilder. Ele pré-analisa o schema uma única vez e retorna um objeto `ICompiledSchema<T>` com dois métodos de validação.

## ICompiledSchema

```typescript
interface ICompiledSchema<TSchema> {
  create(data: InferJson<TSchema>, path?: string): Result<InferProps<TSchema>, Exceptions>;
  assign(data: InferJson<TSchema>, path?: string): Result<InferProps<TSchema>, Exceptions>;
}
```

### `create(data, path?)`

Modo de **validação completa**. Todos os campos marcados como `required: true` (ou sem `required`, pois o padrão é `true`) devem estar presentes nos dados de entrada. Cada campo é validado pelo método `create()` do TypeField correspondente.

Use este modo ao **criar novas entidades ou objetos de valor** a partir de dados externos.

### `assign(data, path?)`

Modo de **validação parcial**. Também exige campos obrigatórios, mas utiliza o método `assign()` do TypeField quando disponível. O método `assign()` pode aplicar regras de validação diferentes — por exemplo, aceitar um ID já existente sem revalidá-lo do zero.

Use este modo ao **atualizar entidades existentes** com dados parciais.

## Exemplo Comparativo

```typescript
import { SchemaBuilder, FString, FEmail, FId, isSuccess } from 'tyforge';
import type { ISchema } from 'tyforge';

const userSchema = {
  id: { type: FId, required: true },
  name: { type: FString, required: true },
  email: { type: FEmail, required: true },
} satisfies ISchema;

const validator = SchemaBuilder.compile(userSchema);

// create — validação completa, ideal para criação
const novoUsuario = validator.create({
  id: crypto.randomUUID(),
  name: 'Maria Silva',
  email: 'maria@email.com',
});

// assign — validação parcial, ideal para atualização
const atualizacao = validator.assign({
  id: idExistente,
  name: 'Maria Santos',
  email: 'maria.santos@email.com',
});
```

## Performance: Compilação Interna

Ao chamar `SchemaBuilder.compile(schema)`, o TyForge converte cada campo do schema em uma estrutura `CompiledField`:

```typescript
interface CompiledField {
  key: string;          // nome do campo
  path: string;         // caminho completo (ex: 'user.address.city')
  required: boolean;    // se o campo é obrigatório
  kind: FieldKind;      // tipo de processamento
  creatable: object;    // referência ao TypeField (se aplicável)
  hasAssign: boolean;   // se possui método assign()
  nestedValidator: object; // validador aninhado (se aplicável)
}
```

O enum `FieldKind` determina o tipo de processamento de cada campo:

| FieldKind | Descrição |
|---|---|
| `Creatable` | Campo simples com TypeField (ex: `FString`, `FEmail`) |
| `NestedSchema` | Objeto aninhado — recursa para sub-schema |
| `ArrayCreatable` | Array de TypeFields (ex: `FString[]`) |
| `ArrayNestedSchema` | Array de objetos aninhados |

Essa pré-análise elimina verificações de tipo (`typeof creatable.create === 'function'`) em cada execução, tornando a validação mais rápida em cenários de uso repetido.

## Relatório de Erros

Ambos os métodos retornam `Result<InferProps<TSchema>, Exceptions>`. O erro inclui o **field path** completo, permitindo localizar exatamente qual campo falhou:

```typescript
import { SchemaBuilder, FString, FEmail, isFailure } from 'tyforge';
import type { ISchema } from 'tyforge';

const schema = {
  user: {
    name: { type: FString, required: true },
    email: { type: FEmail, required: true },
  },
} satisfies ISchema;

const validator = SchemaBuilder.compile(schema);
const result = validator.create({ user: { name: 'Ana', email: 'inválido' } });

if (isFailure(result)) {
  // result.error contem ExceptionValidation com path 'user.email'
  console.log(result.error);
}
```

Para campos ausentes obrigatórios, o erro é `"Campo obrigatório ausente."` com o path do campo. Para arrays, o path inclui o índice (ex: `tags[2]`).

## Objetos Aninhados

O SchemaBuilder suporta objetos aninhados de forma transparente. Basta definir um objeto inline no schema — sem necessidade do wrapper `{ type: ... }`:

```typescript
import { SchemaBuilder, FString } from 'tyforge';
import type { ISchema } from 'tyforge';

const schema = {
  user: {
    name: { type: FString, required: true },
    address: {
      street: { type: FString, required: true },
      city: { type: FString, required: true },
    },
  },
} satisfies ISchema;

const validator = SchemaBuilder.compile(schema);
const result = validator.create({
  user: {
    name: 'Carlos',
    address: {
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
    },
  },
});
```

Objetos aninhados inline são sempre **obrigatórios**. O field path é composto automaticamente: `user.address.street`.

## Arrays

Há duas sintaxes para definir campos do tipo array:

### Sintaxe com `isArray`

```typescript
import { FString, FInt } from 'tyforge';
import type { ISchema } from 'tyforge';

const schema = {
  tags: { type: FString, required: true, isArray: true },
  scores: { type: FInt, required: false, isArray: true },
} satisfies ISchema;
```

### Sintaxe com colchetes

```typescript
import { FString, FInt } from 'tyforge';
import type { ISchema } from 'tyforge';

const schema = {
  tags: [{ type: FString, required: true }],
  scores: [{ type: FInt, required: false }],
} satisfies ISchema;
```

Ambas produzem o mesmo resultado. Na entrada JSON, o campo deve ser um array. Cada item do array é validado individualmente, e o erro inclui o índice:

```typescript
const validator = SchemaBuilder.compile(schema);
const result = validator.create({ tags: ['node', '', 'tyforge'], scores: [10, 20] });

// Se 'tags[1]' for inválido (string vazia), o erro terá path 'tags[1]'
```

### Arrays de Objetos Aninhados

Também é possível definir arrays de objetos complexos:

```typescript
import { SchemaBuilder, FString, FInt } from 'tyforge';
import type { ISchema } from 'tyforge';

const schema = {
  itens: {
    type: {
      produto: { type: FString, required: true },
      quantidade: { type: FInt, required: true },
    },
    required: true,
    isArray: true,
  },
} satisfies ISchema;

const validator = SchemaBuilder.compile(schema);
const result = validator.create({
  itens: [
    { produto: 'Notebook', quantidade: 2 },
    { produto: 'Mouse', quantidade: 5 },
  ],
});
```
