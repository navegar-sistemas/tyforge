# TyForge

[Português](README.pt-BR.md)

[![npm version](https://img.shields.io/npm/v/tyforge)](https://www.npmjs.com/package/tyforge)
[![license](https://img.shields.io/npm/l/tyforge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24-green)](https://nodejs.org/)

Type-safe schema validation, Result pattern and DDD building blocks for TypeScript.

**Zero boilerplate** — install, import, use. Every validation, every naming convention, every architectural pattern already exists in TyForge. You write domain logic, not infrastructure.

## Why TyForge?

### For humans: standardized code, zero debate

TyForge eliminates one of the biggest hidden costs in software teams: deciding how to do things.

Every project that adopts TyForge speaks the same language — same prefixes, same conventions, same validation flow and error handling. A developer familiar with TyForge can open any project based on it and quickly understand the entire structure.

This goes beyond aesthetics. When validation, naming, domain rules, and error handling are already built into the library, developers stop writing repetitive code and focus exclusively on business logic.

The gain is cumulative:

- Faster onboarding
- More objective code reviews
- Fewer inconsistencies
- Safer refactoring

Because every project follows the exact same mental model.

### For AI: less ambiguity, better results

AI coding assistants (Claude, Copilot, Cursor) work best when the environment is predictable. TyForge provides exactly that: a closed set of patterns, rules, and structures that eliminate ambiguity.

Instead of inferring conventions, the AI follows a system already defined — and validated by the code itself.

In practice, this results in:

- **High first-try accuracy** — generated code tends to compile and pass validations without adjustments, thanks to the type system and linter constraints
- **Consistent output** — regardless of model or session, the structure generated for Entities, UseCases, and TypeFields follows the same pattern
- **Automatic self-correction** — errors are quickly caught by `tsc` and `tyforge-lint`, reducing manual iteration
- **Safe composition** — AI can build complex models by combining TypeFields, schemas, and domain events without relying on global context

The result: less trial and error, more usable code from the first generation.

TyForge provides the structure. AI provides the speed.

### Full-stack: one single source of truth

TyForge runs anywhere TypeScript runs — Node.js, Deno, Bun, Angular, React, Vue, Next.js, React Native, Electron. The same TypeFields that validate input on your API validate forms on your UI.

This means:

- Validations don't need to be rewritten
- Formatting doesn't diverge between client and server
- Business rules aren't scattered

A single schema definition becomes the source of truth for the entire stack.

TyForge centralizes the rules. Both sides just consume.

## Installation

```bash
npm install tyforge
```

## Quick Start

### Schema validation with automatic type inference

```typescript
import { SchemaBuilder, FString, FEmail, FInt, isSuccess } from "tyforge";
import type { ISchema, InferProps, InferJson } from "tyforge";

const userSchema = {
  name:  { type: FString },
  email: { type: FEmail },
  age:   { type: FInt, required: false },
} satisfies ISchema;

// Types inferred automatically — zero manual annotation
type TUserJson = InferJson<typeof userSchema>;
// => { name: string; email: string; age?: number }

type TUserProps = InferProps<typeof userSchema>;
// => { name: FString; email: FEmail; age?: FInt }

const validator = SchemaBuilder.compile(userSchema);
const result = validator.create({ name: "Maria Silva", email: "maria@navegar.com" });

if (isSuccess(result)) {
  result.value.name.getValue();  // "Maria Silva"
  result.value.email.getValue(); // "maria@navegar.com"
}
```

### Result pattern — functional error handling

```typescript
import { ok, err, isSuccess, isFailure } from "tyforge";
import type { Result } from "tyforge";

function divide(a: number, b: number): Result<number, Error> {
  if (b === 0) return err(new Error("Division by zero"));
  return ok(a / b);
}

const result = divide(10, 2)
  .map(v => v * 100)           // 500
  .flatMap(v => divide(v, 5))  // 100
  .fold(
    value => `Result: ${value}`,
    error => `Error: ${error.message}`,
  );
// "Result: 100"
```

### TypeFields — validated Value Objects

```typescript
import { FEmail, FDocumentCpf, FCurrency, FPassword, TypeField } from "tyforge";

// Every TypeField validates on creation
const email = FEmail.createOrThrow("user@company.com");
email.getValue();  // "user@company.com"
email.formatted(); // "user@company.com"

// CPF with mod 11 check digit validation
const cpf = FDocumentCpf.createOrThrow("52998224725");
cpf.formatted(); // "529.982.247-25" (progressive mask)

// Password with complexity rules (uppercase, lowercase, digit, special, 8+ chars)
const pwd = FPassword.createOrThrow("S3cur3!Pass");

// Currency with locale-aware formatting
TypeField.configure({ localeDisplay: "br" });
const price = FCurrency.createOrThrow(1234.50);
price.getValue();       // 123450 (stored as integer cents)
price.toDecimalValue(); // 1234.5
price.formatted();      // "1.234,50" (Brazilian format)
```

### Money arithmetic — zero floating point issues

```typescript
import { FMoney, FCurrency } from "tyforge";

const a = FCurrency.createOrThrow(0.1);
const b = FCurrency.createOrThrow(0.2);
const sum = a.add(b);
// 0.1 + 0.2 = 0.30 (not 0.30000000000000004)
// Internally: 10 + 20 = 30 cents

const price = FMoney.createOrThrow(1050);  // 1050 cents
price.toDecimal();    // 10.50
price.isPositive();   // true
price.isZero();       // false

const discount = FMoney.createOrThrow(200);
const final = price.subtract(discount); // 850 cents
```

### Domain Models — Entity, Aggregate, Domain Events

```typescript
import { SchemaBuilder, FId, FString, FEmail, isSuccess, isFailure } from "tyforge";
import { Aggregate, DomainEvent } from "tyforge";
import type { ISchema, InferProps, InferJson } from "tyforge";

const userSchema = {
  id:    { type: FId, required: false },
  name:  { type: FString },
  email: { type: FEmail },
} satisfies ISchema;

type TUserProps = InferProps<typeof userSchema>;
type TUserJson = InferJson<typeof userSchema>;

class EventUserCreated extends DomainEvent<{ userId: string; email: string }> {
  readonly queueName = "user-events";
  static create(userId: string, email: string): EventUserCreated {
    return new EventUserCreated("user.created", { userId, email });
  }
}

class User extends Aggregate<TUserProps, TUserJson> implements TUserProps {
  readonly id: FId | undefined;
  readonly name: FString;
  readonly email: FEmail;

  protected readonly _classInfo = { name: "User", version: "1.0.0", description: "User aggregate" };

  private constructor(props: TUserProps) {
    super();
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
  }

  static create(data: TUserJson) {
    const validator = SchemaBuilder.compile(userSchema);
    const result = validator.create(data);
    if (isFailure(result)) return result;

    const user = new User(result.value);
    const id = user.id?.getValue() ?? FId.generateId();
    user.addDomainEvent(EventUserCreated.create(id, user.email.getValue()));
    return ok(user);
  }
}
```

### Expose / Redaction — control JSON output

```typescript
const schema = {
  name:     { type: FString },
  email:    { type: FEmail, expose: "private" },
  password: { type: FPassword, expose: "redacted" },
} satisfies ISchema;

// toJSON() or toJSON(config, "public") — hides private + redacted
// => { name: "Maria" }

// toJSON(config, "private") — shows private, hides redacted
// => { name: "Maria", email: "maria@email.com" }

// toJSON(config, "redacted") — shows everything
// => { name: "Maria", email: "maria@email.com", password: "S3cur3!Pass" }
```

### Locale system — display + rules, independently configured

```typescript
import { TypeField, FBankCode, FCurrency, FDocumentCpf } from "tyforge";

// Configure separately: how to display vs which rules to apply
TypeField.configure({ localeDisplay: "br", localeRules: "br" });

// localeRules: "br" → enforces ISPB 8-digit format
FBankCode.createOrThrow("60701190"); // OK (Itau ISPB)

// localeDisplay: "br" → formats with Brazilian separators
FCurrency.createOrThrow(1234.50).formatted(); // "1.234,50"

// Strict types (TLocaleDisplay, TLocaleRules) with exhaustive switch:
// adding a new locale causes compile errors wherever handling is missing
```

### Form input normalization

```typescript
import { FCurrency, FInt } from "tyforge";

// formCreate/formAssign normalize string inputs from HTML forms
FCurrency.formCreate("1234,50");  // "1234,50" → 1234.50 → 123450 cents
FInt.formCreate("42");            // "42" → 42
FInt.formCreate("0x1A");          // rejected (hex not allowed)
FInt.formCreate("1e5");           // rejected (scientific notation not allowed)
```

### Batch validation with parallel workers

```typescript
import { SchemaBuilder, FString, FEmail, batchCreate } from "tyforge";
import type { ISchema } from "tyforge";

const schema = {
  name:  { type: FString },
  email: { type: FEmail },
} satisfies ISchema;

const items = Array.from({ length: 10000 }, (_, i) => ({
  name: `User ${i}`,
  email: `user${i}@company.com`,
}));

// Sequential
const result = await batchCreate(schema, items);

// Parallel with 4 worker threads
const result = await batchCreate(schema, items, { concurrency: 4 });
// result.successes: validated items
// result.errors: items that failed with index + error detail
```

### Exceptions — RFC 7807 with lazy stack trace

```typescript
import { ExceptionValidation, ExceptionBusiness, ExceptionNotFound, OHttpStatus } from "tyforge";

const err = ExceptionValidation.create("email", "Invalid email format");
err.status; // 400
err.toJSON();
// {
//   type: "validation",
//   title: "Validation Error",
//   status: 400,
//   detail: "Invalid email format",
//   code: "email"
// }

// Stack trace captured only when accessed (lazy) — zero cost in batch validation
```

### Nested schemas and arrays

```typescript
const orderSchema = {
  id:      { type: FId },
  address: {
    street: { type: FString },
    city:   { type: FString },
    state:  { type: FStateCode },
  },
  items: [{
    type: {
      productId: { type: FId },
      quantity:  { type: FInt },
      price:    { type: FMoney },
    },
  }],
} satisfies ISchema;

// Deeply nested validation with indexed error paths:
// "items[2].price" → "Value must be an integer (cents)"
```

### Linter — enforces conventions automatically

```bash
npx tyforge-lint              # check all .ts files
npx tyforge-lint --staged     # check only staged files
npx tyforge-lint --fix        # auto-fix what's possible
npx tyforge-lint --init       # setup pre-commit hooks (Husky/Lefthook/native)
```

10 rules: `no-any`, `no-cast`, `no-non-null`, `no-ts-ignore`, `no-export-default`, `no-to-json-lowercase`, `no-new-type-field`, `no-magic-http-status`, `no-declare`, `no-satisfies-without-prefix`.

## Modules

| Module | Description |
|--------|-------------|
| **Result Pattern** | `ok()`, `err()`, `map`, `flatMap`, `fold`, `match`, `all`, `allSettled`, `toPromise` — functional error handling with zero exceptions |
| **Schema Builder** | Compiled schema validation with `InferProps`/`InferJson` type inference, nested objects, arrays, `batchCreate`, `composeSchema` |
| **Type Fields** | 50+ validator Value Objects — strings, emails, currency, banking, documents, PIX, security, enums, dates, identifiers |
| **Domain Models** | Entity, ValueObject, Aggregate (with domain events), Dto, DtoReq, DtoRes — full DDD building blocks |
| **Exceptions** | 18 RFC 7807 exception types with lazy stack trace and `OHttpStatus` constants |
| **Application** | UseCase, IMapper, Saga, DomainEventDispatcher, CQRS interfaces |
| **Infrastructure** | IRepositoryBase, IRepositoryRead, Paginated, IUnitOfWork, IOutbox |
| **Tools** | TypeGuard, ToolObjectTransform (flatten/unflatten), ToolCliParser, ToolFileDiscovery, ToolGit |
| **Linter** | `npx tyforge-lint` — 10 rules with `--init` / `--fix` / `--format json` for CI |
| **Config** | `tyforge.config.json` — global validation levels (`full`, `type`, `none`) and linter settings |

### Type Fields by Category

| Category | Fields |
|----------|--------|
| **Strings** | FString, FText, FDescription, FFullName, FBusinessName, FEmail |
| **Numeric** | FInt, FFloat, FPageNumber, FPageSize |
| **Currency** | FMoney (integer cents), FCurrency (decimal convenience) — arithmetic, comparisons, `fromDecimal()` |
| **Dates** | FDate, FDateISODate, FDateTimeISOZ, FDateTimeISOZMillis, FDateISOCompact, FDateTimeISOCompact, FDateTimeISOFullCompact |
| **Identifiers** | FId, FIdReq, FTransactionId, FDeviceId, FCorrelationId, FReconciliationId, FIdempotencyKey, FCertificateThumbprint |
| **Documents** | FDocumentCpf, FDocumentCnpj, FDocumentCpfOrCnpj, FDocumentRg, FDocumentId, FDocumentType, FDocumentStateRegistration, FDocumentMunicipalRegistration |
| **Banking** | FBankCode, FBankBranch, FBankAccountNumber, FBankNsu, FBankE2eId, FEmvQrCodePayload |
| **PIX** | FPixKey, FPixKeyType |
| **Security** | FApiKey, FBearer, FPassword, FSignature, FPublicKeyPem, FTotpCode, FTotpSecret, FHashAlgorithm |
| **Enums** | FAppStatus, FHttpStatus, FBoolInt, FPersonType, FGender, FMaritalStatus, FTransactionStatus, FStateCode |
| **Other** | FBoolean, FJson, FTraceId |

### Subpath Exports

```typescript
import { ok, err } from "tyforge/result";
import { FString, FEmail } from "tyforge/type-fields";
import { ExceptionValidation } from "tyforge/exceptions";
import { SchemaBuilder } from "tyforge/schema";
import { TypeGuard } from "tyforge/tools";
```

## Documentation

Full documentation at [tyforge.navegarsistemas.com.br](https://tyforge.navegarsistemas.com.br).

## License

MIT - [Navegar Sistemas](https://navegarsistemas.com.br/)
