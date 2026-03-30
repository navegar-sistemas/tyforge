---
title: Domain Models
sidebar_position: 1
---

import MermaidDiagram from '@site/src/components/MermaidDiagram';

# Domain Models

O TyForge fornece blocos de construção para Domain-Driven Design (DDD) com suporte a serialização automática de TypeFields, comparação por identidade ou estrutura, e emissão de eventos de domínio.

## Hierarquia de classes

<MermaidDiagram chart={`
graph TD
  Class["Class<br/><i>_classInfo: name, version, description</i>"]
  CDM["ClassDomainModels&lt;TProps, TPropsJson&gt;<br/><i>toJSON(), toPrimitives(), deepUnwrap()</i>"]
  Entity["Entity&lt;TProps, TPropsJson&gt;<br/><i>id?: FId, equals por identidade</i>"]
  VO["ValueObject&lt;TProps, TPropsJson&gt;<br/><i>equals por estrutura (JSON.stringify)</i>"]
  Aggregate["Aggregate&lt;TProps, TPropsJson&gt;<br/><i>domain events</i>"]
  Dto["Dto&lt;TProps, TPropsJson&gt;<br/><i>status?, body?, headers?, query?, params?</i>"]

  Class --> CDM
  CDM --> Entity
  CDM --> VO
  Entity --> Aggregate
  VO --> Dto
`} />

## Classe base: `Class`

Toda hierarquia parte de `Class`, que exige que cada subclasse defina seus metadados:

```typescript
abstract class Class {
  protected abstract readonly _classInfo: TClassInfo;

  public getClassInfo(): TClassInfo;
}

type TClassInfo = {
  name: string;
  version: string;
  description: string;
};
```

## `ClassDomainModels<TProps, TPropsJson>`

Classe intermediária que adiciona os métodos de serialização:

### `toJSON(config?)`

Converte todas as propriedades da instância para seus valores primitivos. TypeFields são automaticamente desembrulhados via `getValue()`. Objetos aninhados com `toJSON()` são recursivamente convertidos.

```typescript
const json = entidade.toJSON();
// Todas as propriedades TypeField são convertidas para primitivos

// Com configuração de data
const jsonDateStr = entidade.toJSON({ date: "string" });
// Campos FDate são serializados como string no formato específico
```

**Configuração de data:**
- `{ date: "string" }` (padrão) — campos `FDate` são convertidos via `toString()` no formato da subclasse
- `{ date: "date" }` — campos `FDate` retornam o objeto `Date` nativo

### `toPrimitives<TInput, TOutput>(input)`

Método estático utilitário para converter qualquer objeto com TypeFields para primitivos:

```typescript
const primitivos = ClassDomainModels.toPrimitives<TProps, TPropsJson>(props);
```

### `deepUnwrap(input, config?)`

Método privado que realiza o unwrap recursivo:
1. Arrays — cada item é processado recursivamente
2. Objetos com `toJSON()` — delegam para seu próprio `toJSON()`
3. Objetos com `getValue()` (TypeFields) — retornam o valor primitivo
4. Campos `FDate` com `config.date === "string"` — retornam `toString()`
5. Campos `undefined` — são omitidos do resultado
6. Outros valores — retornados sem modificação

## Exposição e redação de campos

O `toJSON()` suporta controle de visibilidade por campo via a propriedade `expose` do schema. Isso permite omitir ou redactar campos sensíveis na serialização, sem necessidade de lógica manual.

### Configuração no schema

Cada campo do schema aceita a propriedade `expose` com tres niveis:

```typescript
import { FString, FEmail } from "tyforge";
import type { ISchema } from "tyforge";

const userSchema = {
  name: { type: FString, expose: "public" },
  email: { type: FEmail, expose: "private" },
  passwordHash: { type: FString, expose: "redacted" },
} satisfies ISchema;
```

### Níveis de visibilidade

| Nível | Valor numérico | Descrição |
|-------|---------------|-----------|
| `"public"` | 1 | Visível em todas as serializações |
| `"private"` | 2 | Visível apenas quando solicitado explicitamente |
| `"redacted"` | 3 | Substituído por `"[REDACTED]"` na maioria dos contextos |

A hierarquia segue a ordem: `public` < `private` < `redacted`. Um campo só é incluído no JSON se seu nível de visibilidade for **menor ou igual** ao nível solicitado.

### Uso do `toJSON` com exposeLevel

O método `toJSON` aceita um segundo parâmetro opcional `exposeLevel`:

```typescript
// Serialização pública — campos private e redacted ficam como "[REDACTED]"
const publicJson = entity.toJSON({ date: "string" }, "public");

// Serialização privada — campos redacted ficam como "[REDACTED]"
const privateJson = entity.toJSON({ date: "string" }, "private");

// Serialização completa — todos os campos visíveis
const fullJson = entity.toJSON({ date: "string" }, "redacted");
```

Se `exposeLevel` não for informado, o padrão é `"public"`.

### Campo `_schema`

Para que a redação funcione, o domain model deve definir o campo protegido `_schema` apontando para o schema utilizado:

```typescript
class User extends Aggregate<TUserProps, TUserJson> {
  protected readonly _schema = userSchema;
  // ...
}
```

Se `_schema` não estiver definido, o `toJSON()` inclui todos os campos sem redação.

### Função `getVisibilityLevel`

A função utilitária `getVisibilityLevel` converte um `TExposeLevel` para seu valor numérico:

```typescript
import { getVisibilityLevel } from "tyforge";

getVisibilityLevel("public");   // 1
getVisibilityLevel("private");  // 2
getVisibilityLevel("redacted"); // 3
```

## Próximos passos

- [Entity](/guia/domain-models/entity) — identidade e comparação por ID
- [Value Object](/guia/domain-models/value-object) — comparação estrutural
- [Aggregate](/guia/domain-models/aggregate) — domain events
- [Dto](/guia/domain-models/dto) — Data Transfer Objects com TypeFields
