---
title: Compilacao e Modos
sidebar_position: 2
---

# Compilacao e Modos

O metodo `SchemaBuilder.compile()` e a forma recomendada de usar o SchemaBuilder. Ele pre-analisa o schema uma unica vez e retorna um objeto `CompiledSchema<T>` com dois metodos de validacao.

## CompiledSchema

```typescript
interface CompiledSchema<TSchema> {
  create(data: ISchemaInferJson<TSchema>, path?: string): Result<ISchemaInferProps<TSchema>, Exceptions>;
  assign(data: ISchemaInferJson<TSchema>, path?: string): Result<ISchemaInferProps<TSchema>, Exceptions>;
}
```

### `create(data, path?)`

Modo de **validacao completa**. Todos os campos marcados como `required: true` (ou sem `required`, pois o padrao e `true`) devem estar presentes nos dados de entrada. Cada campo e validado pelo metodo `create()` do TypeField correspondente.

Use este modo ao **criar novas entidades ou objetos de valor** a partir de dados externos.

### `assign(data, path?)`

Modo de **validacao parcial**. Tambem exige campos obrigatorios, mas utiliza o metodo `assign()` do TypeField quando disponivel. O metodo `assign()` pode aplicar regras de validacao diferentes — por exemplo, aceitar um ID ja existente sem revalida-lo do zero.

Use este modo ao **atualizar entidades existentes** com dados parciais.

## Exemplo Comparativo

```typescript
import { SchemaBuilder, FString, FEmail, FId, isSuccess } from 'tyforge';
import type { ISchemaInlineObject } from 'tyforge';

const userSchema = {
  id: { type: FId, required: true },
  name: { type: FString, required: true },
  email: { type: FEmail, required: true },
} satisfies ISchemaInlineObject;

const validator = SchemaBuilder.compile(userSchema);

// create — validacao completa, ideal para criacao
const novoUsuario = validator.create({
  id: crypto.randomUUID(),
  name: 'Maria Silva',
  email: 'maria@email.com',
});

// assign — validacao parcial, ideal para atualizacao
const atualizacao = validator.assign({
  id: idExistente,
  name: 'Maria Santos',
  email: 'maria.santos@email.com',
});
```

## Performance: Compilacao Interna

Ao chamar `SchemaBuilder.compile(schema)`, o TyForge converte cada campo do schema em uma estrutura `CompiledField`:

```typescript
interface CompiledField {
  key: string;          // nome do campo
  path: string;         // caminho completo (ex: 'user.address.city')
  required: boolean;    // se o campo e obrigatorio
  kind: FieldKind;      // tipo de processamento
  creatable: object;    // referencia ao TypeField (se aplicavel)
  hasAssign: boolean;   // se possui metodo assign()
  nestedValidator: object; // validador aninhado (se aplicavel)
}
```

O enum `FieldKind` determina o tipo de processamento de cada campo:

| FieldKind | Descricao |
|---|---|
| `Creatable` | Campo simples com TypeField (ex: `FString`, `FEmail`) |
| `NestedSchema` | Objeto aninhado — recursa para sub-schema |
| `ArrayCreatable` | Array de TypeFields (ex: `FString[]`) |
| `ArrayNestedSchema` | Array de objetos aninhados |

Essa pre-analise elimina verificacoes de tipo (`typeof creatable.create === 'function'`) em cada execucao, tornando a validacao mais rapida em cenarios de uso repetido.

## Relatorio de Erros

Ambos os metodos retornam `Result<ISchemaInferProps<TSchema>, Exceptions>`. O erro inclui o **field path** completo, permitindo localizar exatamente qual campo falhou:

```typescript
import { SchemaBuilder, FString, FEmail, isFailure } from 'tyforge';
import type { ISchemaInlineObject } from 'tyforge';

const schema = {
  user: {
    name: { type: FString, required: true },
    email: { type: FEmail, required: true },
  },
} satisfies ISchemaInlineObject;

const validator = SchemaBuilder.compile(schema);
const result = validator.create({ user: { name: 'Ana', email: 'invalido' } });

if (isFailure(result)) {
  // result.error contem ExceptionValidation com path 'user.email'
  console.log(result.error);
}
```

Para campos ausentes obrigatorios, o erro e `"Campo obrigatorio ausente."` com o path do campo. Para arrays, o path inclui o indice (ex: `tags[2]`).

## SchemaBuilder.build() — Retrocompatibilidade

O metodo `build()` oferece a mesma funcionalidade sem pre-compilacao:

```typescript
static build<TSchema>(
  schema: TSchema,
  data: ISchemaInferJson<TSchema>,
  path?: string,
  mode: 'create' | 'assign',
): Result<ISchemaInferProps<TSchema>, Exceptions>
```

A diferenca e que `build()` analisa o schema a cada chamada. Para schemas usados uma unica vez, a diferenca de performance e insignificante. Para schemas reutilizados (ex: em endpoints de API), prefira `compile()`.

```typescript
// Equivalente ao compile().create(), porem sem pre-compilacao
const resultado = SchemaBuilder.build(userSchema, dados, 'user', 'create');
```

## Objetos Aninhados

O SchemaBuilder suporta objetos aninhados de forma transparente. Basta definir um objeto inline no schema — sem necessidade do wrapper `{ type: ... }`:

```typescript
import { SchemaBuilder, FString } from 'tyforge';
import type { ISchemaInlineObject } from 'tyforge';

const schema = {
  user: {
    name: { type: FString, required: true },
    address: {
      street: { type: FString, required: true },
      city: { type: FString, required: true },
    },
  },
} satisfies ISchemaInlineObject;

const validator = SchemaBuilder.compile(schema);
const result = validator.create({
  user: {
    name: 'Carlos',
    address: {
      street: 'Rua das Flores, 123',
      city: 'Sao Paulo',
    },
  },
});
```

Objetos aninhados inline sao sempre **obrigatorios**. O field path e composto automaticamente: `user.address.street`.

## Arrays

Ha duas sintaxes para definir campos do tipo array:

### Sintaxe com `isArray`

```typescript
import { FString, FInt } from 'tyforge';
import type { ISchemaInlineObject } from 'tyforge';

const schema = {
  tags: { type: FString, required: true, isArray: true },
  scores: { type: FInt, required: false, isArray: true },
} satisfies ISchemaInlineObject;
```

### Sintaxe com colchetes

```typescript
import { FString, FInt } from 'tyforge';
import type { ISchemaInlineObject } from 'tyforge';

const schema = {
  tags: [{ type: FString, required: true }],
  scores: [{ type: FInt, required: false }],
} satisfies ISchemaInlineObject;
```

Ambas produzem o mesmo resultado. Na entrada JSON, o campo deve ser um array. Cada item do array e validado individualmente, e o erro inclui o indice:

```typescript
const validator = SchemaBuilder.compile(schema);
const result = validator.create({ tags: ['node', '', 'tyforge'], scores: [10, 20] });

// Se 'tags[1]' for invalido (string vazia), o erro tera path 'tags[1]'
```

### Arrays de Objetos Aninhados

Tambem e possivel definir arrays de objetos complexos:

```typescript
import { SchemaBuilder, FString, FInt } from 'tyforge';
import type { ISchemaInlineObject } from 'tyforge';

const schema = {
  itens: {
    type: {
      produto: { type: FString, required: true },
      quantidade: { type: FInt, required: true },
    },
    required: true,
    isArray: true,
  },
} satisfies ISchemaInlineObject;

const validator = SchemaBuilder.compile(schema);
const result = validator.create({
  itens: [
    { produto: 'Notebook', quantidade: 2 },
    { produto: 'Mouse', quantidade: 5 },
  ],
});
```
