# TyForge

[Português](README.pt-BR.md)

[![npm version](https://img.shields.io/npm/v/tyforge)](https://www.npmjs.com/package/tyforge)
[![license](https://img.shields.io/npm/l/tyforge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24-green)](https://nodejs.org/)

Type-safe schema validation, Result pattern and DDD building blocks for TypeScript.

**Zero boilerplate** — install, import, use. TyForge provides ready-to-use TypeFields for common patterns (strings, emails, currency, banking, authentication) so you write domain logic, not validation code.

## Installation

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
  console.error(result.error.detail); // validation message
}
```

## Modules

| Module | Description |
|--------|-------------|
| **Result Pattern** | `ok()`, `err()`, `map`, `flatMap`, `fold`, `match`, `all`, `allSettled` — functional error handling |
| **Schema Builder** | Compiled schema validation with type inference, `batchCreate`, `composeSchema` |
| **Type Fields** | 50+ validator Value Objects (FString, FEmail, FId, FInt, FDate...) |
| **Domain Models** | Entity, ValueObject, Aggregate with domain events, Dto, DtoReq, DtoRes |
| **Exceptions** | 18 RFC 7807 exception types with lazy stack trace |
| **Application** | UseCase, IMapper, Saga, DomainEventDispatcher |
| **Infrastructure** | IRepositoryBase, IRepositoryRead, Paginated, IUnitOfWork, IOutbox |
| **Tools** | TypeGuard (extended), ToolObjectTransform (flatten/unflatten with prototype pollution protection) |
| **Linter** | `npx tyforge-lint` with `--init` / `--update` / `--uninstall` for pre-commit hooks |
| **Config** | `tyforge.config.json` — global validation levels (`full`, `type`, `none`) for `create` and `assign` |

### Additional Features

- **Expose/Redaction** — `expose: "private" | "redacted"` in schema controls `toJSON()` field visibility
- **Batch Create** — `batchCreate()` with parallel workers for high-throughput validation

## Documentation

Full documentation at [tyforge.navegarsistemas.com.br](https://tyforge.navegarsistemas.com.br).

## License

MIT - [Navegar Sistemas](https://navegarsistemas.com.br/)
