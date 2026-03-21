---
title: Inferencia de Tipos
sidebar_position: 3
---

# Inferencia de Tipos

O sistema de tipos do TyForge infere automaticamente os tipos de entrada (JSON) e saida (Props) a partir da definicao do schema. Isso elimina a necessidade de declarar interfaces manualmente e garante que a validacao esta alinhada com os tipos do TypeScript.

## ISchemaFieldConfig

Interface que define a configuracao de um campo individual no schema:

```typescript
interface ISchemaFieldConfig {
  type: ValueObjectStatic<unknown, TypeField<unknown>>
      | EntityStatic<Entity<IEntityPropsBase, unknown>>
      | Schema;
  required?: boolean;       // padrao: true
  isArray?: boolean;        // padrao: false
  expose?: 'public' | 'private' | 'redacted';
  label?: string;
  description?: string;
}
```

| Propriedade | Tipo | Descricao |
|---|---|---|
| `type` | TypeField, Entity ou objeto inline | O tipo do campo — define como ele sera validado |
| `required` | `boolean` | Se o campo e obrigatorio. Padrao: `true` |
| `isArray` | `boolean` | Se o campo aceita um array de valores. Padrao: `false` |
| `expose` | `string` | Nivel de exposicao do campo para serializacao |
| `label` | `string` | Rotulo legivel para o campo (ex: para documentacao de API) |
| `description` | `string` | Descricao detalhada do campo |

## Schema

Representa um objeto aninhado dentro do schema, sem o wrapper `{ type: ... }`. Cada chave contem outro campo ou sub-objeto:

```typescript
interface Schema {
  [key: string]: ISchemaFieldConfig | Schema;
}
```

**Exemplo:**

```typescript
import { FString } from 'tyforge';
import type { Schema } from 'tyforge';

// 'address' e um Schema — nao possui { type: ... }
const schema = {
  name: { type: FString, required: true },     // ISchemaFieldConfig
  address: {                                     // Schema
    street: { type: FString, required: true },
    city: { type: FString, required: true },
  },
} satisfies Schema;
```

## InferJson

Infere o tipo da entrada JSON (dados brutos com primitivos) a partir do schema. Campos com `required: false` tornam-se propriedades opcionais.

```typescript
type InferJson<TSchema extends Schema>
```

### Regras de Inferencia para JSON

| Definicao no Schema | Tipo Inferido |
|---|---|
| `{ type: FString, required: true }` | `string` (obrigatorio) |
| `{ type: FInt, required: false }` | `number?` (opcional) |
| `{ type: FEmail, required: true, isArray: true }` | `string[]` (obrigatorio) |
| `{ type: FBoolean, required: false, isArray: true }` | `boolean[]?` (opcional) |
| Objeto inline | Recursao para sub-tipo |
| `{ type: MinhaEntity, required: true }` | `unknown` (Entities usam unknown) |

**Exemplo:**

```typescript
import { SchemaBuilder, FString, FEmail, FInt, FBoolean } from 'tyforge';
import type { InferJson, Schema } from 'tyforge';

const userSchema = {
  name: { type: FString, required: true },
  email: { type: FEmail, required: true },
  age: { type: FInt, required: false },
  active: { type: FBoolean, required: true },
} satisfies Schema;

type UserJson = InferJson<typeof userSchema>;
// Resultado:
// {
//   name: string;
//   email: string;
//   age?: number;
//   active: boolean;
// }
```

## InferProps

Infere o tipo da saida validada (instancias de TypeField) a partir do schema. Campos com `required: false` tornam-se propriedades opcionais.

```typescript
type InferProps<TSchema extends Schema>
```

### Regras de Inferencia para Props

| Definicao no Schema | Tipo Inferido |
|---|---|
| `{ type: FString, required: true }` | `FString` (obrigatorio) |
| `{ type: FInt, required: false }` | `FInt?` (opcional) |
| `{ type: FEmail, required: true, isArray: true }` | `FEmail[]` (obrigatorio) |
| Objeto inline | Recursao para sub-tipo com instancias |
| `{ type: MinhaEntity, required: true }` | `MinhaEntity` (instancia da entidade) |

**Exemplo:**

```typescript
import { SchemaBuilder, FString, FEmail, FInt, FBoolean } from 'tyforge';
import type { InferProps, Schema } from 'tyforge';

const userSchema = {
  name: { type: FString, required: true },
  email: { type: FEmail, required: true },
  age: { type: FInt, required: false },
  active: { type: FBoolean, required: true },
} satisfies Schema;

type UserProps = InferProps<typeof userSchema>;
// Resultado:
// {
//   name: FString;
//   email: FEmail;
//   age?: FInt;
//   active: FBoolean;
// }
```

## Inferencia com Arrays

Quando `isArray: true` esta presente, tanto `InferJson` quanto `InferProps` produzem arrays:

```typescript
import { FString, FInt } from 'tyforge';
import type { InferJson, InferProps, Schema } from 'tyforge';

const schema = {
  tags: { type: FString, required: true, isArray: true },
  scores: { type: FInt, required: false, isArray: true },
} satisfies Schema;

type JsonType = InferJson<typeof schema>;
// {
//   tags: string[];
//   scores?: number[];
// }

type PropsType = InferProps<typeof schema>;
// {
//   tags: FString[];
//   scores?: FInt[];
// }
```

## Inferencia com Objetos Aninhados

Objetos inline (sem wrapper `{ type: ... }`) sao tratados recursivamente. O tipo inferido reflete a estrutura aninhada:

```typescript
import { FString } from 'tyforge';
import type { InferJson, InferProps, Schema } from 'tyforge';

const schema = {
  user: {
    name: { type: FString, required: true },
    address: {
      street: { type: FString, required: true },
      city: { type: FString, required: true },
      zip: { type: FString, required: false },
    },
  },
} satisfies Schema;

type JsonType = InferJson<typeof schema>;
// {
//   user: {
//     name: string;
//     address: {
//       street: string;
//       city: string;
//       zip?: string;
//     };
//   };
// }

type PropsType = InferProps<typeof schema>;
// {
//   user: {
//     name: FString;
//     address: {
//       street: FString;
//       city: FString;
//       zip?: FString;
//     };
//   };
// }
```

## Entidades no Schema

Entidades que implementam a interface `EntityStatic` podem ser usadas diretamente como tipo de campo. A interface requer um metodo estatico `create`:

```typescript
interface EntityStatic<TInstance extends Entity<IEntityPropsBase, unknown>> {
  create(value: unknown, fieldPath?: string): Result<TInstance, Exceptions>;
}
```

**Exemplo com entidade:**

```typescript
import { SchemaBuilder, FString, FInt, isSuccess } from 'tyforge';
import type { InferProps, Schema } from 'tyforge';

// Supondo que Produto e uma Entity com create() estatico
const pedidoSchema = {
  numero: { type: FInt, required: true },
  cliente: { type: FString, required: true },
  produto: { type: Produto, required: true },
} satisfies Schema;

type PedidoProps = InferProps<typeof pedidoSchema>;
// {
//   numero: FInt;
//   cliente: FString;
//   produto: Produto;   // instancia da entidade
// }

const validator = SchemaBuilder.compile(pedidoSchema);
const result = validator.create({
  numero: 1001,
  cliente: 'Joao Silva',
  produto: { id: 'abc-123', nome: 'Notebook', preco: 4500 },
});

if (isSuccess(result)) {
  const props = result.value;
  // props.produto e uma instancia de Produto, validada pelo Produto.create()
}
```

## Exemplo Completo

O exemplo abaixo demonstra todas as capacidades de inferencia em um unico schema:

```typescript
import {
  SchemaBuilder, FString, FEmail, FInt, FBoolean, isSuccess,
} from 'tyforge';
import type { InferJson, InferProps, Schema } from 'tyforge';

const cadastroSchema = {
  nome: { type: FString, required: true },
  email: { type: FEmail, required: true },
  idade: { type: FInt, required: false },
  ativo: { type: FBoolean, required: true },
  tags: { type: FString, required: false, isArray: true },
  endereco: {
    rua: { type: FString, required: true },
    cidade: { type: FString, required: true },
    cep: { type: FString, required: false },
  },
} satisfies Schema;

// Tipo da entrada JSON
type CadastroJson = InferJson<typeof cadastroSchema>;
// {
//   nome: string;
//   email: string;
//   idade?: number;
//   ativo: boolean;
//   tags?: string[];
//   endereco: {
//     rua: string;
//     cidade: string;
//     cep?: string;
//   };
// }

// Tipo da saida validada
type CadastroProps = InferProps<typeof cadastroSchema>;
// {
//   nome: FString;
//   email: FEmail;
//   idade?: FInt;
//   ativo: FBoolean;
//   tags?: FString[];
//   endereco: {
//     rua: FString;
//     cidade: FString;
//     cep?: FString;
//   };
// }

// Uso
const validator = SchemaBuilder.compile(cadastroSchema);

const result = validator.create({
  nome: 'Ana Costa',
  email: 'ana@empresa.com',
  ativo: true,
  tags: ['admin', 'gerente'],
  endereco: {
    rua: 'Av. Paulista, 1000',
    cidade: 'Sao Paulo',
  },
});

if (isSuccess(result)) {
  const props = result.value;
  // Todos os campos sao instancias tipadas de TypeField
  // props.nome.getValue()     -> 'Ana Costa'
  // props.email.getValue()    -> 'ana@empresa.com'
  // props.idade               -> undefined (campo opcional nao enviado)
  // props.ativo.getValue()    -> true
  // props.tags![0].getValue() -> 'admin'
  // props.endereco.rua.getValue() -> 'Av. Paulista, 1000'
}
```
