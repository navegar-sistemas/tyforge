---
title: Inferência de Tipos
sidebar_position: 3
---

# Inferência de Tipos

O sistema de tipos do TyForge infere automaticamente os tipos de entrada (JSON) e saída (Props) a partir da definição do schema. Isso elimina a necessidade de declarar interfaces manualmente e garante que a validação está alinhada com os tipos do TypeScript.

## IFieldConfig

Interface que define a configuração de um campo individual no schema:

```typescript
interface IFieldConfig {
  type: IValueObjectStatic<unknown, TypeField<unknown>>
      | IEntityStatic<Entity<IEntityProps, unknown>>
      | ISchema;
  required?: boolean;       // padrão: true
  isArray?: boolean;        // padrão: false
  expose?: TExposeLevel;
  label?: string;
  description?: string;
  validate?: {
    create?: TValidationLevel;
    assign?: TValidationLevel;
  };
}
```

| Propriedade | Tipo | Descrição |
|---|---|---|
| `type` | TypeField, Entity ou objeto inline | O tipo do campo — define como ele será validado |
| `required` | `boolean` | Se o campo é obrigatório. Padrão: `true` |
| `isArray` | `boolean` | Se o campo aceita um array de valores. Padrão: `false` |
| `expose` | `TExposeLevel` | Nível de exposição do campo para serialização (veja abaixo) |
| `label` | `string` | Rótulo legível para o campo (ex: para documentação de API) |
| `description` | `string` | Descrição detalhada do campo |
| `validate` | `object` | Sobrescrita do nível de validação por campo (opções: `create` e `assign`) |

### TExposeLevel

Tipo que define os níveis de exposição de campos na serialização:

```typescript
const OExposeLevel = { PUBLIC: "public", PRIVATE: "private", REDACTED: "redacted" } as const;
type TExposeLevel = typeof OExposeLevel[keyof typeof OExposeLevel];
// "public" | "private" | "redacted"
```

O `OExposeLevel` é um objeto `as const` que segue a convenção de prefixo `O` para enums do TyForge.

### getVisibilityLevel

Função utilitária que converte um `TExposeLevel` para um valor numérico, usada internamente pelo `toJSON()` para decidir quais campos incluir:

```typescript
function getVisibilityLevel(expose: TExposeLevel | undefined): number
```

| Nível | Valor numérico |
|-------|---------------|
| `"public"` | 1 |
| `"private"` | 2 |
| `"redacted"` | 3 |

Um campo é incluído no JSON se seu `getVisibilityLevel(campo.expose)` for **menor ou igual** ao `getVisibilityLevel(exposeLevel)` solicitado no `toJSON()`. Campos que excedem o nível solicitado são substituídos por `"[REDACTED]"`.

### Propriedade validate por campo

A propriedade `validate` permite sobrescrever o nível de validação global para um campo específico:

```typescript
const schema = {
  name: { type: FString },                                      // usa nível global
  email: { type: FEmail, validate: { create: "full" } },        // sempre full no create
  legacyField: { type: FString, validate: { assign: "none" } }, // sem validação no assign
} satisfies ISchema;
```

Os níveis possíveis são `"full"`, `"type"` e `"none"`, conforme documentado na [configuração global](/guia/config/configuracao-global).

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

// 'address' é um Schema — não possui { type: ... }
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

### Regras de Inferência para JSON

| Definição no Schema | Tipo Inferido |
|---|---|
| `{ type: FString, required: true }` | `string` (obrigatório) |
| `{ type: FInt, required: false }` | `number?` (opcional) |
| `{ type: FEmail, required: true, isArray: true }` | `string[]` (obrigatório) |
| `{ type: FBoolean, required: false, isArray: true }` | `boolean[]?` (opcional) |
| Objeto inline | Recursão para sub-tipo |
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

Infere o tipo da saída validada (instâncias de TypeField) a partir do schema. Campos com `required: false` tornam-se propriedades opcionais.

```typescript
type InferProps<TSchema extends ISchema>
```

### Regras de Inferência para Props

| Definição no Schema | Tipo Inferido |
|---|---|
| `{ type: FString, required: true }` | `FString` (obrigatório) |
| `{ type: FInt, required: false }` | `FInt?` (opcional) |
| `{ type: FEmail, required: true, isArray: true }` | `FEmail[]` (obrigatório) |
| Objeto inline | Recursão para sub-tipo com instâncias |
| `{ type: MinhaEntity, required: true }` | `MinhaEntity` (instância da entidade) |

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

## Inferência com Arrays

Quando `isArray: true` está presente, tanto `InferJson` quanto `InferProps` produzem arrays:

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

## Inferência com Objetos Aninhados

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

Entidades que implementam a interface `EntityStatic` podem ser usadas diretamente como tipo de campo. A interface requer um método estático `create`:

```typescript
interface EntityStatic<TInstance extends Entity<IEntityPropsBase, unknown>> {
  create(value: unknown, fieldPath?: string): Result<TInstance, Exceptions>;
}
```

**Exemplo com entidade:**

```typescript
import { SchemaBuilder, FString, FInt, isSuccess } from 'tyforge';
import type { InferProps, ISchema } from 'tyforge';

// Supondo que Produto é uma Entity com create() estático
const pedidoSchema = {
  numero: { type: FInt, required: true },
  cliente: { type: FString, required: true },
  produto: { type: Produto, required: true },
} satisfies ISchema;

type PedidoProps = InferProps<typeof pedidoSchema>;
// {
//   numero: FInt;
//   cliente: FString;
//   produto: Produto;   // instância da entidade
// }

const validator = SchemaBuilder.compile(pedidoSchema);
const result = validator.create({
  numero: 1001,
  cliente: 'João Silva',
  produto: { id: 'abc-123', nome: 'Notebook', preco: 4500 },
});

if (isSuccess(result)) {
  const props = result.value;
  // props.produto é uma instância de Produto, validada pelo Produto.create()
}
```

## Exemplo Completo

O exemplo abaixo demonstra todas as capacidades de inferência em um único schema:

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

// Tipo da saída validada
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
    cidade: 'São Paulo',
  },
});

if (isSuccess(result)) {
  const props = result.value;
  // Todos os campos são instâncias tipadas de TypeField
  // props.nome.getValue()     -> 'Ana Costa'
  // props.email.getValue()    -> 'ana@empresa.com'
  // props.idade               -> undefined (campo opcional não enviado)
  // props.ativo.getValue()    -> true
  // props.tags![0].getValue() -> 'admin'
  // props.endereco.rua.getValue() -> 'Av. Paulista, 1000'
}
```
