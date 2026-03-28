---
id: introducao
title: Introdução
sidebar_position: 1
---

import MermaidDiagram from '@site/src/components/MermaidDiagram';

# TyForge — Type-safe Validation Library

**TyForge** é uma biblioteca TypeScript para validação de schemas com segurança de tipos, Result pattern e blocos de construção para Domain-Driven Design, desenvolvida pela [Navegar Sistemas](https://github.com/navegar-sistemas).

Toda operação de validação retorna um `Result<T, E>` em vez de lançar exceções, garantindo tratamento de erros explícito e composicional em todo o fluxo da aplicação.

## Instalação

```bash
npm install tyforge
```

## Início rápido

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

## Visão geral dos módulos

| Módulo | Descrição |
|--------|-----------|
| **Result Pattern** | Tratamento de erros funcional com `ok()`, `err()`, `map`, `flatMap`, `fold`, `match`, `all` |
| **Schema Builder** | Validação compilada de schemas com inferência completa de tipos |
| **Type Fields** | Value Objects validadores (`FString`, `FEmail`, `FId`, `FMoney`, `FCurrency`, `FDocumentCpf`...) |
| **Domain Models** | `Entity`, `ValueObject`, `Aggregate` com domain events, `Dto` |
| **Exceptions** | Tipos RFC 7807 com stack trace lazy |

## Arquitetura de módulos

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

O módulo **Result** é a base de toda a biblioteca — todos os demais módulos retornam `Result<T, E>` em suas operações de criação e validação. Os **Type Fields** consomem Result e Exceptions para validar valores primitivos, e são utilizados tanto pelo **Schema Builder** (composição de schemas) quanto pelos **Domain Models** (entidades e agregados).

## Stack técnica

| Item | Detalhe |
|------|---------|
| Linguagem | TypeScript |
| Formato | ESM (ES2022) |
| Runtime | Node >= 24 |
| Dependência | `uuid` (única dependência de produção) |

## Próximos passos

- [Visão Geral da Arquitetura](/contribuindo/arquitetura)
- [Result Pattern](/guia/result/visao-geral)
- [Schema Builder](/guia/schema/visao-geral)
- [Type Fields](/guia/type-fields/visao-geral)
- [Domain Models](/guia/domain-models/visao-geral)
- [Exceptions](/guia/exceptions/visao-geral)
