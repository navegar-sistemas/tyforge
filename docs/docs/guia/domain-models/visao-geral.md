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
  CDM["ClassDomainModels&lt;TProps, TPropsJson&gt;<br/><i>toJson(), toPrimitives(), deepUnwrap()</i>"]
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

### `toJson(config?)`

Converte todas as propriedades da instancia para seus valores primitivos. TypeFields sao automaticamente desembrulhados via `getValue()`. Objetos aninhados com `toJson()` sao recursivamente convertidos.

```typescript
const json = entidade.toJson();
// Todas as propriedades TypeField sao convertidas para primitivos

// Com configuracao de data
const jsonDateStr = entidade.toJson({ date: "string" });
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
2. Objetos com `toJson()` — delegam para seu proprio `toJson()`
3. Objetos com `getValue()` (TypeFields) — retornam o valor primitivo
4. Campos `FDate` com `config.date === "string"` — retornam `toString()`
5. Campos `undefined` — sao omitidos do resultado
6. Outros valores — retornados sem modificacao

## Proximos passos

- [Entity](/guia/domain-models/entity) — identidade e comparacao por ID
- [Value Object](/guia/domain-models/value-object) — comparacao estrutural
- [Aggregate](/guia/domain-models/aggregate) — domain events
- [Dto](/guia/domain-models/dto) — Data Transfer Objects com TypeFields
