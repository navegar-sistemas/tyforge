---
title: Sistema de Tipos
sidebar_position: 2
---

import MermaidDiagram from '@site/src/components/MermaidDiagram';

# Sistema de Tipos

O TyForge utiliza o sistema de tipos do TypeScript para inferir automaticamente os tipos de entrada (JSON) e saída (instâncias de TypeField) a partir da definição do schema. Nenhuma anotação manual de tipos é necessária — tudo é derivado em tempo de compilação.

## Pipeline de inferência

<MermaidDiagram chart={`
sequenceDiagram
  participant J as JSON Input
  participant I as InferJson&lt;T&gt;
  participant C as SchemaBuilder.compile()
  participant V as Validação
  participant P as InferProps&lt;T&gt;

  J->>I: Dados brutos tipados
  I->>C: Schema + JSON tipado
  C->>V: Validador compilado
  V->>P: Props com instâncias TypeField
`} />

O fluxo funciona assim:

1. O desenvolvedor define um **schema** usando TypeFields e configurações.
2. `InferJson<T>` infere o tipo dos **dados de entrada** (primitivos JSON).
3. `SchemaBuilder.compile()` gera um validador otimizado.
4. A validação transforma os dados de entrada em `InferProps<T>` — um objeto com **instâncias de TypeField**.

## Interfaces principais

### ValueObjectStatic

Interface que representa um TypeField com método estático `create`. É a base para a inferência de tipos primitivos e instâncias.

```typescript
interface ValueObjectStatic<TPrimitive, TInstance extends TypeField<TPrimitive>> {
  create(value: TPrimitive, fieldPath?: string): Result<TInstance, Exceptions>;
}
```

### EntityStatic

Interface análoga para entidades que implementam o método `create`.

```typescript
interface EntityStatic<TInstance extends Entity<IEntityPropsBase, unknown>> {
  create(value: unknown, fieldPath?: string): Result<TInstance, Exceptions>;
}
```

### ISchemaFieldConfig

Configuração de um campo individual no schema. Define o tipo, obrigatoriedade, suporte a arrays, exposição e metadados.

```typescript
interface ISchemaFieldConfig {
  type:
    | ValueObjectStatic<unknown, TypeField<unknown>>
    | EntityStatic<Entity<IEntityPropsBase, unknown>>
    | ISchema;
  required?: boolean;   // default: true
  isArray?: boolean;    // default: false
  expose?: "public" | "private" | "redacted";
  label?: string;
  description?: string;
}
```

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `type` | `ValueObjectStatic \| EntityStatic \| ISchema` | O TypeField, Entity ou objeto inline que valida o campo |
| `required` | `boolean?` | Se `false`, o campo é opcional no JSON de entrada. Padrão: `true` |
| `isArray` | `boolean?` | Se `true`, o valor esperado é um array de itens do `type` |
| `expose` | `string?` | Controle de visibilidade: `"public"`, `"private"` ou `"redacted"` |
| `label` | `string?` | Rótulo legível para o campo (útil em mensagens de erro e UI) |
| `description` | `string?` | Descrição detalhada do campo |

### ISchema

Representa um objeto aninhado dentro do schema, permitindo composição de estruturas complexas sem criar TypeFields dedicados.

```typescript
interface ISchema {
  [key: string]: ISchemaFieldConfig | ISchema;
}
```

## Inferência de tipos

### InferPrimitive

Extrai o tipo primitivo (para JSON) a partir do `type` do campo:

- Se for um `ValueObjectStatic<TP, ...>`, extrai `TP` (ex.: `FString` -> `string`, `FInt` -> `number`).
- Se for um `EntityStatic`, retorna `unknown` (o caller deve especializar).
- Se for um `ISchema`, aplica recursão via `InferJson`.

```typescript
type InferPrimitive<T> =
  T extends ValueObjectStatic<infer TP, TypeField<infer TP>>
    ? TP
    : T extends EntityStatic<Entity<IEntityPropsBase, unknown>>
      ? unknown
      : T extends ISchema
        ? InferJson<T>
        : never;
```

### InferInstance

Extrai o tipo da instância (para props) a partir do `type` do campo:

- Se for um `ValueObjectStatic<..., TI>`, extrai `TI` (ex.: `FString` -> instância de `FString`).
- Se for um `EntityStatic<TE>`, extrai `TE` (a instância da Entity).
- Se for um `ISchema`, aplica recursão via `InferProps`.

```typescript
type InferInstance<T> =
  T extends ValueObjectStatic<unknown, infer TI>
    ? TI
    : T extends EntityStatic<infer TE>
      ? TE
      : T extends ISchema
        ? InferProps<T>
        : never;
```

### InferJson

Mapeia o schema inteiro para o tipo de JSON de entrada. Campos com `required: false` se tornam opcionais (`?`). Campos com `isArray: true` se tornam arrays.

```typescript
type InferJson<TSchema extends ISchema> = {
  // campos opcionais (required: false)
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? K : never]?: /* InferPrimitive ou InferPrimitive[] */;
} & {
  // campos obrigatórios
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? never : K]: /* InferPrimitive ou InferPrimitive[] */;
};
```

### InferProps

Análogo ao `InferJson`, porém mapeia para instâncias de TypeField em vez de primitivos.

```typescript
type InferProps<TSchema extends ISchema> = {
  // campos opcionais
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? K : never]?: /* InferInstance ou InferInstance[] */;
} & {
  // campos obrigatórios
  [K in keyof TSchema as TSchema[K] extends { required: false }
    ? never : K]: /* InferInstance ou InferInstance[] */;
};
```

## Exemplo completo

O exemplo abaixo demonstra como a definição de um schema flui pelo sistema de tipos:

```typescript
import { FString, FEmail, FInt, SchemaBuilder, isSuccess } from "tyforge";
import type { ISchema } from "tyforge";

// 1. Definição do schema
const schema = {
  name:  { type: FString, required: true },
  email: { type: FEmail, required: true },
  age:   { type: FInt, required: false },
} satisfies ISchema;

// 2. Tipos inferidos automaticamente:
//
// InferJson<typeof schema>
// => { name: string; email: string; age?: number }
//
// InferProps<typeof schema>
// => { name: FString; email: FEmail; age?: FInt }

// 3. Compilação e uso
const validator = SchemaBuilder.compile(schema);

// O TypeScript garante que 'data' corresponde a InferJson
const result = validator.create({
  name: "Maria Silva",
  email: "maria@navegar.com",
  // age é opcional — pode ser omitido
});

if (isSuccess(result)) {
  // result.value é tipado como InferProps
  const props = result.value;
  props.name;   // tipo: FString
  props.email;  // tipo: FEmail
  props.age;    // tipo: FInt | undefined
}
```

### Schema com objetos aninhados

Objetos inline permitem compor estruturas complexas diretamente no schema:

```typescript
import { FId, FString } from "tyforge";
import type { ISchema } from "tyforge";

const orderSchema = {
  id:      { type: FId, required: true },
  address: {
    street: { type: FString, required: true },
    city:   { type: FString, required: true },
  },
  items: {
    type: FString,
    required: true,
    isArray: true,
  },
} satisfies ISchema;

// InferJson<typeof orderSchema>
// => {
//   id: string;
//   address: { street: string; city: string };
//   items: string[];
// }
```

A inferência funciona recursivamente — objetos aninhados geram tipos aninhados tanto no JSON de entrada quanto nos props de saída.
