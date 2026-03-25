---
title: Domain Models
sidebar_position: 1
---

import MermaidDiagram from '@site/src/components/MermaidDiagram';

# Domain Models

O TyForge fornece blocos de construcao para Domain-Driven Design (DDD) com suporte a serializacao automatica de TypeFields, comparacao por identidade ou estrutura, e emissao de eventos de dominio.

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

Classe intermediaria que adiciona os metodos de serializacao:

### `toJSON(config?)`

Converte todas as propriedades da instancia para seus valores primitivos. TypeFields sao automaticamente desembrulhados via `getValue()`. Objetos aninhados com `toJSON()` sao recursivamente convertidos.

```typescript
const json = entidade.toJSON();
// Todas as propriedades TypeField sao convertidas para primitivos

// Com configuracao de data
const jsonDateStr = entidade.toJSON({ date: "string" });
// Campos FDate sao serializados como string no formato especifico
```

**Configuracao de data:**
- `{ date: "string" }` (padrao) — campos `FDate` sao convertidos via `toString()` no formato da subclasse
- `{ date: "date" }` — campos `FDate` retornam o objeto `Date` nativo

### `toPrimitives<TInput, TOutput>(input)`

Metodo estatico utilitario para converter qualquer objeto com TypeFields para primitivos:

```typescript
const primitivos = ClassDomainModels.toPrimitives<TProps, TPropsJson>(props);
```

### `deepUnwrap(input, config?)`

Metodo privado que realiza o unwrap recursivo:
1. Arrays — cada item e processado recursivamente
2. Objetos com `toJSON()` — delegam para seu proprio `toJSON()`
3. Objetos com `getValue()` (TypeFields) — retornam o valor primitivo
4. Campos `FDate` com `config.date === "string"` — retornam `toString()`
5. Campos `undefined` — sao omitidos do resultado
6. Outros valores — retornados sem modificacao

## Exposicao e redacao de campos

O `toJSON()` suporta controle de visibilidade por campo via a propriedade `expose` do schema. Isso permite omitir ou redactar campos sensiveis na serializacao, sem necessidade de logica manual.

### Configuracao no schema

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

### Niveis de visibilidade

| Nivel | Valor numerico | Descricao |
|-------|---------------|-----------|
| `"public"` | 1 | Visivel em todas as serializacoes |
| `"private"` | 2 | Visivel apenas quando solicitado explicitamente |
| `"redacted"` | 3 | Substituido por `"[REDACTED]"` na maioria dos contextos |

A hierarquia segue a ordem: `public` < `private` < `redacted`. Um campo so e incluido no JSON se seu nivel de visibilidade for **menor ou igual** ao nivel solicitado.

### Uso do `toJSON` com exposeLevel

O metodo `toJSON` aceita um segundo parametro opcional `exposeLevel`:

```typescript
// Serializacao publica — campos private e redacted ficam como "[REDACTED]"
const publicJson = entity.toJSON({ date: "string" }, "public");

// Serializacao privada — campos redacted ficam como "[REDACTED]"
const privateJson = entity.toJSON({ date: "string" }, "private");

// Serializacao completa — todos os campos visiveis
const fullJson = entity.toJSON({ date: "string" }, "redacted");
```

Se `exposeLevel` nao for informado, o padrao e `"public"`.

### Campo `_schema`

Para que a redacao funcione, o domain model deve definir o campo protegido `_schema` apontando para o schema utilizado:

```typescript
class User extends Aggregate<TUserProps, TUserJson> {
  protected readonly _schema = userSchema;
  // ...
}
```

Se `_schema` nao estiver definido, o `toJSON()` inclui todos os campos sem redacao.

### Funcao `getVisibilityLevel`

A funcao utilitaria `getVisibilityLevel` converte um `TExposeLevel` para seu valor numerico:

```typescript
import { getVisibilityLevel } from "tyforge";

getVisibilityLevel("public");   // 1
getVisibilityLevel("private");  // 2
getVisibilityLevel("redacted"); // 3
```

## Proximos passos

- [Entity](/guia/domain-models/entity) — identidade e comparacao por ID
- [Value Object](/guia/domain-models/value-object) — comparacao estrutural
- [Aggregate](/guia/domain-models/aggregate) — domain events
- [Dto](/guia/domain-models/dto) — Data Transfer Objects com TypeFields
