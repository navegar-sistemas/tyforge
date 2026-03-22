---
id: introducao
title: Introducao
sidebar_position: 1
---

import MermaidDiagram from '@site/src/components/MermaidDiagram';

# TyForge — Type-safe Validation Library

**TyForge** e uma biblioteca TypeScript para validacao de schemas com seguranca de tipos, Result pattern e blocos de construcao para Domain-Driven Design, desenvolvida pela [Navegar Sistemas](https://github.com/navegar-sistemas).

Toda operacao de validacao retorna um `Result<T, E>` em vez de lancar excecoes, garantindo tratamento de erros explicito e composicional em todo o fluxo da aplicacao.

## Instalacao

```bash
npm install tyforge
```

## Inicio rapido

```typescript
import {
  FString,
  FEmail,
  SchemaBuilder,
  isSuccess,
  isFailure,
} from "tyforge";
import type { ISchema } from "tyforge";

// 1. Defina o schema com TypeFields
const userSchema = {
  name:  { type: FString, required: true },
  email: { type: FEmail, required: true },
} satisfies ISchema;

// 2. Compile o schema (uma vez)
const validator = SchemaBuilder.compile(userSchema);

// 3. Valide os dados de entrada
const result = validator.create({
  name: "Maria Silva",
  email: "maria@navegar.com",
});

// 4. Trate o resultado de forma segura
if (isSuccess(result)) {
  console.log(result.value.name);  // FString
  console.log(result.value.email); // FEmail
}

if (isFailure(result)) {
  console.error(result.error); // Exceptions (RFC 7807)
}
```

## Visao geral dos modulos

| Modulo | Descricao |
|--------|-----------|
| **Result Pattern** | Tratamento de erros funcional com `ok()`, `err()`, `map`, `flatMap`, `fold`, `match`, `all` |
| **Schema Builder** | Validacao compilada de schemas com inferencia completa de tipos |
| **Type Fields** | 25+ Value Objects validadores (`FString`, `FEmail`, `FId`, `FInt`, `FDate`...) |
| **Domain Models** | `Entity`, `ValueObject`, `Aggregate` com domain events, `Dto` |
| **Exceptions** | 18 tipos RFC 7807 com stack trace lazy |

## Arquitetura de modulos

<MermaidDiagram chart={`
graph TD
  Result["Result Pattern"]
  Exceptions["Exceptions"]
  TypeFields["Type Fields"]
  Schema["Schema Builder"]
  DomainModels["Domain Models"]

  Result --> TypeFields
  Result --> Schema
  Result --> DomainModels
  Exceptions --> TypeFields
  Exceptions --> Schema
  TypeFields --> Schema
  TypeFields --> DomainModels
`} />

O modulo **Result** e a base de toda a biblioteca — todos os demais modulos retornam `Result<T, E>` em suas operacoes de criacao e validacao. Os **Type Fields** consomem Result e Exceptions para validar valores primitivos, e sao utilizados tanto pelo **Schema Builder** (composicao de schemas) quanto pelos **Domain Models** (entidades e agregados).

## Stack tecnica

| Item | Detalhe |
|------|---------|
| Linguagem | TypeScript 5.7 |
| Formato | CommonJS (ES2022) |
| Runtime | Node >= 18 |
| Dependencia | `uuid` (unica dependencia de producao) |

## Proximos passos

- [Visao Geral da Arquitetura](/contribuindo/arquitetura)
- [Result Pattern](/guia/result/visao-geral)
- [Schema Builder](/guia/schema/visao-geral)
- [Type Fields](/guia/type-fields/visao-geral)
- [Domain Models](/guia/domain-models/visao-geral)
- [Exceptions](/guia/exceptions/visao-geral)
