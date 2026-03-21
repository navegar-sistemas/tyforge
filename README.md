# TyForge

[![npm version](https://img.shields.io/npm/v/tyforge)](https://www.npmjs.com/package/tyforge)
[![license](https://img.shields.io/npm/l/tyforge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green)](https://nodejs.org/)

Validacao de schemas type-safe, Result pattern e building blocks DDD para TypeScript.

## Instalacao

```bash
npm install tyforge
```

## Quick Start

```typescript
import { SchemaBuilder, FString, FEmail, isSuccess, isFailure } from "tyforge";
import type { ISchemaInlineObject } from "tyforge";

const userSchema = {
  name:  { type: FString, required: true },
  email: { type: FEmail, required: true },
} satisfies ISchemaInlineObject;

const validator = SchemaBuilder.compile(userSchema);

const result = validator.create({
  name: "Maria Silva",
  email: "maria@navegar.com",
});

if (isSuccess(result)) {
  const props = result.value;
  props.name.getValue();  // "Maria Silva"
  props.email.getValue(); // "maria@navegar.com"
}

if (isFailure(result)) {
  console.error(result.error.detail); // mensagem de validacao
}
```

## Modulos

| Modulo | Descricao |
|--------|-----------|
| **Result Pattern** | `ok()`, `err()`, `map`, `flatMap`, `fold`, `match`, `all` — error handling funcional |
| **Schema Builder** | Validacao compilada de schemas com inferencia de tipos |
| **Type Fields** | 25+ Value Objects validadores (FString, FEmail, FId, FInt, FDate...) |
| **Domain Models** | Entity, ValueObject, Aggregate com domain events, Dto |
| **Exceptions** | 18 tipos RFC 7807 com stack trace lazy |

## Documentacao

Documentacao completa em [tyforge.navegarsistemas.com.br](https://tyforge.navegarsistemas.com.br).

## Licenca

MIT - [Navegar Sistemas](https://navegarsistemas.com.br/)
