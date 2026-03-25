---
title: Inferencia de Tipos
sidebar_position: 3
---

# Inferencia de Tipos

O sistema de tipos do TyForge infere automaticamente os tipos de entrada (JSON) e saida (Props) a partir da definicao do schema. Isso elimina a necessidade de declarar interfaces manualmente e garante que a validacao esta alinhada com os tipos do TypeScript.

## IFieldConfig

Interface que define a configuracao de um campo individual no schema:

```typescript
interface IFieldConfig {
  type: IValueObjectStatic<unknown, TypeField<unknown>>
      | IEntityStatic<Entity<IEntityProps, unknown>>
      | ISchema;
  required?: boolean;       // padrao: true
  isArray?: boolean;        // padrao: false
  expose?: TExposeLevel;
  label?: string;
  description?: string;
  validate?: {
    create?: TValidationLevel;
    assign?: TValidationLevel;
  };
}
```

| Propriedade | Tipo | Descricao |
|---|---|---|
| `type` | TypeField, Entity ou objeto inline | O tipo do campo — define como ele sera validado |
| `required` | `boolean` | Se o campo e obrigatorio. Padrao: `true` |
| `isArray` | `boolean` | Se o campo aceita um array de valores. Padrao: `false` |
| `expose` | `TExposeLevel` | Nivel de exposicao do campo para serializacao (veja abaixo) |
| `label` | `string` | Rotulo legivel para o campo (ex: para documentacao de API) |
| `description` | `string` | Descricao detalhada do campo |
| `validate` | `object` | Sobrescrita do nivel de validacao por campo (opcoes: `create` e `assign`) |

### TExposeLevel

Tipo que define os niveis de exposicao de campos na serializacao:

```typescript
const OExposeLevel = { PUBLIC: "public", PRIVATE: "private", REDACTED: "redacted" } as const;
type TExposeLevel = typeof OExposeLevel[keyof typeof OExposeLevel];
// "public" | "private" | "redacted"
```

O `OExposeLevel` e um objeto `as const` que segue a convencao de prefixo `O` para enums do TyForge.

### getVisibilityLevel

Funcao utilitaria que converte um `TExposeLevel` para um valor numerico, usada internamente pelo `toJSON()` para decidir quais campos incluir:

```typescript
function getVisibilityLevel(expose: TExposeLevel | undefined): number
```

| Nivel | Valor numerico |
|-------|---------------|
| `"public"` | 1 |
| `"private"` | 2 |
| `"redacted"` | 3 |

Um campo e incluido no JSON se seu `getVisibilityLevel(campo.expose)` for **menor ou igual** ao `getVisibilityLevel(exposeLevel)` solicitado no `toJSON()`. Campos que excedem o nivel solicitado sao substituidos por `"[REDACTED]"`.

### Propriedade validate por campo

A propriedade `validate` permite sobrescrever o nivel de validacao global para um campo especifico:

```typescript
const schema = {
  name: { type: FString },                                      // usa nivel global
  email: { type: FEmail, validate: { create: "full" } },        // sempre full no create
  legacyField: { type: FString, validate: { assign: "none" } }, // sem validacao no assign
} satisfies ISchema;
```

Os niveis possiveis sao `"full"`, `"type"` e `"none"`, conforme documentado na [configuracao global](/guia/config/configuracao-global).

## ISchema

Representa um objeto aninhado dentro do schema, sem o wrapper `{ type: ... }`. Cada chave contem outro campo ou sub-objeto:

```typescript
interface ISchema {
  [key: string]: ISchemaFieldConfig | ISchema;
}
```

**Exemplo:**

```typescript
import { FString } from 'tyforge';
import type { ISchema } from 'tyforge';

// 'address' e um Schema — nao possui { type: ... }
const schema = {
  name: { type: FString, required: true },     // ISchemaFieldConfig
  address: {                                     // Schema
    street: { type: FString, required: true },
    city: { type: FString, required: true },
  },
} satisfies ISchema;
```

## InferJson

Infere o tipo da entrada JSON (dados brutos com primitivos) a partir do schema. Campos com `required: false` tornam-se propriedades opcionais.

```typescript
type InferJson<TSchema extends ISchema>
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
import type { InferJson, ISchema } from 'tyforge';

const userSchema = {
  name: { type: FString, required: true },
  email: { type: FEmail, required: true },
  age: { type: FInt, required: false },
  active: { type: FBoolean, required: true },
} satisfies ISchema;

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
type InferProps<TSchema extends ISchema>
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
import type { InferProps, ISchema } from 'tyforge';

const userSchema = {
  name: { type: FString, required: true },
  email: { type: FEmail, required: true },
  age: { type: FInt, required: false },
  active: { type: FBoolean, required: true },
} satisfies ISchema;

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
import type { InferJson, InferProps, ISchema } from 'tyforge';

const schema = {
  tags: { type: FString, required: true, isArray: true },
  scores: { type: FInt, required: false, isArray: true },
} satisfies ISchema;

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
import type { InferJson, InferProps, ISchema } from 'tyforge';

const schema = {
  user: {
    name: { type: FString, required: true },
    address: {
      street: { type: FString, required: true },
      city: { type: FString, required: true },
      zip: { type: FString, required: false },
    },
  },
} satisfies ISchema;

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
import type { InferProps, ISchema } from 'tyforge';

// Supondo que Produto e uma Entity com create() estatico
const pedidoSchema = {
  numero: { type: FInt, required: true },
  cliente: { type: FString, required: true },
  produto: { type: Produto, required: true },
} satisfies ISchema;

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
import type { InferJson, InferProps, ISchema } from 'tyforge';

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
} satisfies ISchema;

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
