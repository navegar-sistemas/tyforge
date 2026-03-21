---
title: Inferencia de Tipos
sidebar_position: 3
slug: /schema/tipos
---

# Inferencia de Tipos

O sistema de tipos do TyForge infere automaticamente os tipos de entrada (JSON) e saida (Props) a partir da definicao do schema. Isso elimina a necessidade de declarar interfaces manualmente e garante que a validacao esta alinhada com os tipos do TypeScript.

## ISchemaFieldConfig

Interface que define a configuracao de um campo individual no schema:

```typescript
interface ISchemaFieldConfig {
  type: ValueObjectStatic<unknown, TypeField<unknown>>
      | EntityStatic<Entity<IEntityPropsBase, unknown>>
      | ISchemaInlineObject;
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

## ISchemaInlineObject

Representa um objeto aninhado dentro do schema, sem o wrapper `{ type: ... }`. Cada chave contem outro campo ou sub-objeto:

```typescript
interface ISchemaInlineObject {
  [key: string]: ISchemaFieldConfig | ISchemaInlineObject;
}
```

**Exemplo:**

```typescript
import { FString } from '@navegar-sistemas/tyforge';
import type { ISchemaInlineObject } from '@navegar-sistemas/tyforge';

// 'address' e um ISchemaInlineObject — nao possui { type: ... }
const schema = {
  name: { type: FString, required: true },     // ISchemaFieldConfig
  address: {                                     // ISchemaInlineObject
    street: { type: FString, required: true },
    city: { type: FString, required: true },
  },
} satisfies ISchemaInlineObject;
```

## ISchemaInferJson

Infere o tipo da entrada JSON (dados brutos com primitivos) a partir do schema. Campos com `required: false` tornam-se propriedades opcionais.

```typescript
type ISchemaInferJson<TSchema extends ISchemaInlineObject>
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
import { SchemaBuilder, FString, FEmail, FInt, FBoolean } from '@navegar-sistemas/tyforge';
import type { ISchemaInferJson, ISchemaInlineObject } from '@navegar-sistemas/tyforge';

const userSchema = {
  name: { type: FString, required: true },
  email: { type: FEmail, required: true },
  age: { type: FInt, required: false },
  active: { type: FBoolean, required: true },
} satisfies ISchemaInlineObject;

type UserJson = ISchemaInferJson<typeof userSchema>;
// Resultado:
// {
//   name: string;
//   email: string;
//   age?: number;
//   active: boolean;
// }
```

## ISchemaInferProps

Infere o tipo da saida validada (instancias de TypeField) a partir do schema. Campos com `required: false` tornam-se propriedades opcionais.

```typescript
type ISchemaInferProps<TSchema extends ISchemaInlineObject>
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
import { SchemaBuilder, FString, FEmail, FInt, FBoolean } from '@navegar-sistemas/tyforge';
import type { ISchemaInferProps, ISchemaInlineObject } from '@navegar-sistemas/tyforge';

const userSchema = {
  name: { type: FString, required: true },
  email: { type: FEmail, required: true },
  age: { type: FInt, required: false },
  active: { type: FBoolean, required: true },
} satisfies ISchemaInlineObject;

type UserProps = ISchemaInferProps<typeof userSchema>;
// Resultado:
// {
//   name: FString;
//   email: FEmail;
//   age?: FInt;
//   active: FBoolean;
// }
```

## Inferencia com Arrays

Quando `isArray: true` esta presente, tanto `ISchemaInferJson` quanto `ISchemaInferProps` produzem arrays:

```typescript
import { FString, FInt } from '@navegar-sistemas/tyforge';
import type { ISchemaInferJson, ISchemaInferProps, ISchemaInlineObject } from '@navegar-sistemas/tyforge';

const schema = {
  tags: { type: FString, required: true, isArray: true },
  scores: { type: FInt, required: false, isArray: true },
} satisfies ISchemaInlineObject;

type JsonType = ISchemaInferJson<typeof schema>;
// {
//   tags: string[];
//   scores?: number[];
// }

type PropsType = ISchemaInferProps<typeof schema>;
// {
//   tags: FString[];
//   scores?: FInt[];
// }
```

## Inferencia com Objetos Aninhados

Objetos inline (sem wrapper `{ type: ... }`) sao tratados recursivamente. O tipo inferido reflete a estrutura aninhada:

```typescript
import { FString } from '@navegar-sistemas/tyforge';
import type { ISchemaInferJson, ISchemaInferProps, ISchemaInlineObject } from '@navegar-sistemas/tyforge';

const schema = {
  user: {
    name: { type: FString, required: true },
    address: {
      street: { type: FString, required: true },
      city: { type: FString, required: true },
      zip: { type: FString, required: false },
    },
  },
} satisfies ISchemaInlineObject;

type JsonType = ISchemaInferJson<typeof schema>;
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

type PropsType = ISchemaInferProps<typeof schema>;
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
import { SchemaBuilder, FString, FInt, isSuccess } from '@navegar-sistemas/tyforge';
import type { ISchemaInferProps, ISchemaInlineObject } from '@navegar-sistemas/tyforge';

// Supondo que Produto e uma Entity com create() estatico
const pedidoSchema = {
  numero: { type: FInt, required: true },
  cliente: { type: FString, required: true },
  produto: { type: Produto, required: true },
} satisfies ISchemaInlineObject;

type PedidoProps = ISchemaInferProps<typeof pedidoSchema>;
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
} from '@navegar-sistemas/tyforge';
import type { ISchemaInferJson, ISchemaInferProps, ISchemaInlineObject } from '@navegar-sistemas/tyforge';

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
} satisfies ISchemaInlineObject;

// Tipo da entrada JSON
type CadastroJson = ISchemaInferJson<typeof cadastroSchema>;
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
type CadastroProps = ISchemaInferProps<typeof cadastroSchema>;
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
