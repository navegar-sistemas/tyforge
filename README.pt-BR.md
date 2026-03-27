# TyForge

[English](README.md)

[![npm version](https://img.shields.io/npm/v/tyforge)](https://www.npmjs.com/package/tyforge)
[![license](https://img.shields.io/npm/l/tyforge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24-green)](https://nodejs.org/)

Validação de schemas type-safe, Result pattern e building blocks DDD para TypeScript.

**Zero boilerplate** — instale, importe, use. TyForge fornece TypeFields prontos para padrões comuns (strings, emails, moeda, bancário, autenticação) para que você escreva lógica de domínio, não código de validação.

## Instalação

```bash
npm install tyforge
```

## Quick Start

```typescript
import { SchemaBuilder, FString, FEmail, isSuccess, isFailure } from "tyforge";
import type { ISchema } from "tyforge";

const userSchema = {
  name:  { type: FString, required: true },
  email: { type: FEmail, required: true },
} satisfies ISchema;

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
  console.error(result.error.detail); // mensagem de validação
}
```

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **Result Pattern** | `ok()`, `err()`, `map`, `flatMap`, `fold`, `match`, `all`, `allSettled` — error handling funcional |
| **Schema Builder** | Validação compilada de schemas com inferência de tipos, `batchCreate`, `composeSchema` |
| **Type Fields** | 50+ Value Objects validadores (FString, FEmail, FId, FInt, FDate...) |
| **Domain Models** | Entity, ValueObject, Aggregate com domain events, Dto, DtoReq, DtoRes |
| **Exceptions** | 18 tipos RFC 7807 com stack trace lazy |
| **Application** | UseCase, IMapper, Saga, DomainEventDispatcher |
| **Infrastructure** | IRepositoryBase, IRepositoryRead, Paginated, IUnitOfWork, IOutbox |
| **Tools** | TypeGuard (estendido), ToolObjectTransform (flatten/unflatten com proteção contra prototype pollution) |
| **Linter** | `npx tyforge-lint` com `--init` / `--update` / `--uninstall` para pre-commit hooks |
| **Config** | `tyforge.config.json` — níveis de validação global (`full`, `type`, `none`) para `create` e `assign` |

### Funcionalidades adicionais

- **Expose/Redaction** — `expose: "private" | "redacted"` no schema controla visibilidade de campos no `toJSON()`
- **Batch Create** — `batchCreate()` com workers paralelos para validação de alto throughput

## Documentação

Documentação completa em [tyforge.navegarsistemas.com.br](https://tyforge.navegarsistemas.com.br).

## Licença

MIT - [Navegar Sistemas](https://navegarsistemas.com.br/)
