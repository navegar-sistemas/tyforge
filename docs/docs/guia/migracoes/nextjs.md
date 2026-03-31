---
title: Next.js
sidebar_position: 1
---

# Migração: Next.js com TyForge

> Guia completo para migrar projetos Next.js para os padrões TyForge aplicando Clean Architecture, Clean Code e SOLID.

---

## Visão Geral

TyForge é um framework TypeScript que fornece building blocks para DDD (Domain-Driven Design), validação type-safe e Result pattern. Este guia mostra como migrar um projeto Next.js existente para os padrões TyForge de nível empresarial.

### O que TyForge resolve

| Problema comum em Next.js | Solução TyForge |
|---|---|
| Validação espalhada em controllers/pages | `SchemaBuilder` + `TypeFields` centralizam validação |
| Lógica de negócio em API routes | `Aggregate` + `Entity` encapsulam regras |
| Erros inconsistentes entre API routes | `Exceptions` (RFC 7807) padronizam respostas |
| Tipos manuais que divergem do runtime | `InferProps` / `InferJson` infere tipos do schema |
| `try/catch` aninhados sem padrão | `Result<T, E>` para error handling funcional |
| Dados sensíveis vazando em responses | `expose: "redacted"` / `"private"` no schema |
| Input não validado chegando no domain | `DtoReq` valida na fronteira HTTP |

---

## Estrutura de Pastas

```
src/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── users/
│   │       ├── route.ts          # HTTP handler (controller)
│   │       └── [id]/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx
│
├── modules/                      # Módulos de domínio
│   └── user/
│       ├── domain/               # Camada de domínio (puro, sem deps externas)
│       │   ├── user.aggregate.ts
│       │   ├── user.schema.ts
│       │   ├── user.types.ts
│       │   └── events/
│       │       └── event-user-registered.ts
│       │
│       ├── application/          # Camada de aplicação (orquestra domínio)
│       │   ├── use-cases/
│       │   │   ├── register-user.use-case.ts
│       │   │   └── get-user.use-case.ts
│       │   ├── dtos/
│       │   │   ├── dto-req-create-user.ts
│       │   │   └── dto-res-user-profile.ts
│       │   └── mapper-user.ts
│       │
│       └── infrastructure/       # Camada de infraestrutura (implementações)
│           └── repository-user-prisma.ts
│
├── shared/                       # Código compartilhado entre módulos
│   ├── exceptions/
│   │   └── http-error-handler.ts
│   └── middleware/
│       └── validate-request.ts
│
└── config/
    └── tyforge.setup.ts          # Configuração opcional do TyForge
```

### Regras de dependência (Clean Architecture)

```
app/api/ (controllers) → application/ → domain/
                       → infrastructure/
                       ↑
         infrastructure/ implementa interfaces do domain/
```

- **Domain** não importa de nenhuma outra camada
- **Application** importa do domain
- **Infrastructure** implementa interfaces definidas no domain
- **Controllers** (app/api/) compõem application + infrastructure

---

## Instalação

```bash
npm install tyforge
```

Criar `tyforge.config.json` na raiz do projeto:

```json
{
  "schema": {
    "validate": {
      "create": "full",
      "assign": "type"
    }
  },
  "lint": {
    "root": "src",
    "strict": true,
    "exclude": ["**/__tests__/**"]
  }
}
```

---

## Passo a Passo: Módulo de Usuário

### 1. Schema e Tipos (Domain)

O schema é a fonte de verdade. Tipos são inferidos dele — nunca definidos manualmente.

```typescript
// src/modules/user/domain/user.schema.ts
import {
  FId, FString, FEmail, FInt, FAppStatus,
  type ISchema, SchemaBuilder,
} from "tyforge";

export const userSchema = {
  id: { type: FId, required: false },
  name: { type: FString },
  email: { type: FEmail, expose: "private" },
  age: { type: FInt },
  status: { type: FAppStatus },
} satisfies ISchema;

export const userValidator = SchemaBuilder.compile(userSchema);
```

```typescript
// src/modules/user/domain/user.types.ts
import type { InferProps, InferJson } from "tyforge";
import type { userSchema } from "./user.schema";

export type TUserProps = InferProps<typeof userSchema>;
export type TUserJson = InferJson<typeof userSchema>;
```

**Por que assim:**
- O schema define validação E tipos ao mesmo tempo
- `InferProps` gera o tipo com TypeFields (FString, FEmail, etc.)
- `InferJson` gera o tipo primitivo (string, number, etc.) — usado para persistência
- `expose: "private"` esconde o email em respostas públicas
- Nenhum tipo manual — se o schema muda, os tipos mudam junto

---

### 2. Aggregate (Domain)

O Aggregate encapsula as regras de negócio. Nenhuma regra fica no controller ou use case.

```typescript
// src/modules/user/domain/user.aggregate.ts
import {
  Aggregate, FId, OAppStatus,
  ok, err, isFailure,
  ExceptionBusiness,
  type Result, type Exceptions,
} from "tyforge";
import { userSchema, userValidator } from "./user.schema";
import type { TUserProps, TUserJson } from "./user.types";
import { EventUserRegistered } from "./events/event-user-registered";

export class User extends Aggregate<TUserProps, TUserJson> implements TUserProps {
  readonly id: FId | undefined;
  readonly name: FString;
  readonly email: FEmail;
  readonly age: FInt;
  readonly status: FAppStatus;

  protected readonly _classInfo = { name: "User", version: "1.0.0", description: "User aggregate" };
  protected readonly _schema = userSchema;

  private constructor(props: TUserProps) {
    super(props);
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.age = props.age;
    this.status = props.status;
  }

  static create(data: TUserJson): Result<User, Exceptions> {
    const result = userValidator.create(data);
    if (isFailure(result)) return result;

    // Regras de negócio
    if (result.value.age.getValue() < 18) {
      return err(ExceptionBusiness.invalidBusinessRule("User must be at least 18 years old"));
    }

    const user = new User({
      id: FId.generate(),
      ...result.value,
      status: FAppStatus.createOrThrow(OAppStatus.ACTIVE),
    });

    user.addDomainEvent(
      EventUserRegistered.create({
        userId: user.id!.getValue(),
        email: user.email.getValue(),
      })
    );

    return ok(user);
  }

  static assign(data: TUserJson): Result<User, Exceptions> {
    const result = userValidator.assign(data);
    if (isFailure(result)) return result;
    return ok(new User(result.value));
  }
}
```

**Por que assim:**
- `implements TUserProps` garante que a classe tem todos os campos do schema
- `_schema = userSchema` habilita expose/redaction no `toJSON()`
- `create()` retorna `Result` — nunca throw no domain
- Regras de negócio (idade >= 18) ficam AQUI, não no controller
- `assign()` é para hidratação do banco — validação leve, sem regras de negócio
- Domain Event emitido no create — registra o que aconteceu

---

### 3. Domain Event

```typescript
// src/modules/user/domain/events/event-user-registered.ts
import { DomainEvent } from "tyforge";

interface TEventUserRegisteredPayload {
  userId: string;
  email: string;
}

export class EventUserRegistered extends DomainEvent<TEventUserRegisteredPayload> {
  readonly queueName = "user-events";

  static create(payload: TEventUserRegisteredPayload): EventUserRegistered {
    return new EventUserRegistered("user.registered", payload);
  }
}
```

**Por que assim:**
- `static create()` — nunca `new` direto (convenção TyForge)
- `queueName` define para onde o evento vai (fila, tópico, etc.)
- Payload tipado — sem `Record<string, unknown>` genérico
- Prefixo `Event` no nome da classe

---

### 4. DTO de Request (Application)

O DTO recebe dados brutos da request HTTP e valida.

```typescript
// src/modules/user/application/dtos/dto-req-create-user.ts
import {
  Dto, FString, FEmail, FInt,
  SchemaBuilder, ok, isFailure,
  type ISchema, type InferProps, type InferJson,
  type Result, type Exceptions,
} from "tyforge";

const createUserSchema = {
  name: { type: FString },
  email: { type: FEmail },
  age: { type: FInt },
} satisfies ISchema;

const createUserValidator = SchemaBuilder.compile(createUserSchema);

type TDtoCreateUserProps = InferProps<typeof createUserSchema>;
type TDtoCreateUserJson = InferJson<typeof createUserSchema>;

export class DtoReqCreateUser extends Dto<TDtoCreateUserProps, TDtoCreateUserJson> {
  readonly name: FString;
  readonly email: FEmail;
  readonly age: FInt;

  protected readonly _classInfo = { name: "DtoReqCreateUser", version: "1.0.0", description: "Create user request" };

  private constructor(props: TDtoCreateUserProps) {
    super(props);
    this.name = props.name;
    this.email = props.email;
    this.age = props.age;
  }

  static create(body: unknown): Result<DtoReqCreateUser, Exceptions> {
    const result = createUserValidator.createUnknown(body);
    if (isFailure(result)) return result;
    return ok(new DtoReqCreateUser(result.value));
  }
}
```

**Por que assim:**
- `create(body: unknown)` — o controller passa `req.body` sem tipar
- `SchemaBuilder.compile().createUnknown()` aceita `unknown` e valida tudo
- Se a validação falha, retorna `Result` com erro descritivo — nunca throw
- O DTO não contém lógica de negócio — só valida formato
- Prefixo `DtoReq` para DTOs de request

---

### 5. DTO de Response (Application)

```typescript
// src/modules/user/application/dtos/dto-res-user-profile.ts
import {
  Dto, FId, FString, FEmail, FInt, FBoolean, FAppStatus,
  SchemaBuilder, ok, isFailure,
  type ISchema, type InferProps, type InferJson,
  type Result, type Exceptions,
} from "tyforge";
import type { User } from "../../domain/user.aggregate";

const userProfileSchema = {
  id: { type: FId },
  name: { type: FString },
  email: { type: FEmail, expose: "private" },
  age: { type: FInt },
  status: { type: FAppStatus },
} satisfies ISchema;

const userProfileValidator = SchemaBuilder.compile(userProfileSchema);

type TDtoResUserProfileProps = InferProps<typeof userProfileSchema>;
type TDtoResUserProfileJson = InferJson<typeof userProfileSchema>;

export class DtoResUserProfile extends Dto<TDtoResUserProfileProps, TDtoResUserProfileJson> {
  readonly id: FId;
  readonly name: FString;
  readonly email: FEmail;
  readonly age: FInt;
  readonly status: FAppStatus;

  protected readonly _classInfo = { name: "DtoResUserProfile", version: "1.0.0", description: "User profile response" };
  protected readonly _schema = userProfileSchema;

  private constructor(props: TDtoResUserProfileProps) {
    super(props);
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.age = props.age;
    this.status = props.status;
  }

  static fromDomain(user: User): Result<DtoResUserProfile, Exceptions> {
    const json = user.toJSON();
    const result = userProfileValidator.create(json);
    if (isFailure(result)) return result;
    return ok(new DtoResUserProfile(result.value));
  }
}
```

**Por que assim:**
- `fromDomain(user)` converte Aggregate → DTO de resposta
- `_schema = userProfileSchema` habilita redação: `toJSON(config, "public")` esconde `email`
- O controller decide qual nível de expose usar
- Prefixo `DtoRes` para DTOs de response

---

### 6. Use Case (Application)

```typescript
// src/modules/user/application/use-cases/register-user.use-case.ts
import { UseCase, isFailure } from "tyforge";
import { User } from "../../domain/user.aggregate";
import type { DtoReqCreateUser } from "../dtos/dto-req-create-user";
import type { IRepositoryUser } from "../../domain/repository-user.interface";

export class RegisterUserUseCase extends UseCase<DtoReqCreateUser, User> {
  protected readonly _classInfo = {
    name: "RegisterUserUseCase",
    version: "1.0.0",
    description: "Registers a new user",
  };

  constructor(private readonly repository: IRepositoryUser) {
    super();
  }

  async execute(dto: DtoReqCreateUser): Promise<User> {
    const userResult = User.create({
      name: dto.name.getValue(),
      email: dto.email.getValue(),
      age: dto.age.getValue(),
    });
    if (isFailure(userResult)) throw userResult.error;

    const user = userResult.value;

    const saveResult = await this.repository.create(user);
    if (isFailure(saveResult)) throw saveResult.error;

    return user;
  }
}
```

**Por que assim:**
- Recebe DTO já validado — nunca primitivos
- Retorna domain model — nunca primitivos
- `throw` na fronteira da aplicação — converte `Result` error em exception
- Repository injetado via constructor (Dependency Inversion)
- `_classInfo` obrigatório em toda classe concreta

---

### 7. Mapper (Application)

```typescript
// src/modules/user/application/mapper-user.ts
import { type IMapper, ok, isFailure, type Result, type Exceptions } from "tyforge";
import type { Paginated } from "tyforge";
import { User } from "../domain/user.aggregate";
import type { TUserJson } from "../domain/user.types";

export class MapperUser implements IMapper<User, TUserJson> {
  toDomain(raw: TUserJson): Result<User, Exceptions> {
    return User.assign(raw);
  }

  toDomainMany(raw: TUserJson[]): Result<User[], Exceptions> {
    const users: User[] = [];
    for (const item of raw) {
      const result = this.toDomain(item);
      if (isFailure(result)) return result;
      users.push(result.value);
    }
    return ok(users);
  }

  toPersistence(domain: User): Result<TUserJson, Exceptions> {
    return ok(domain.toJSON());
  }

  toPersistenceMany(domains: User[]): Result<TUserJson[], Exceptions> {
    const items: TUserJson[] = [];
    for (const domain of domains) {
      const result = this.toPersistence(domain);
      if (isFailure(result)) return result;
      items.push(result.value);
    }
    return ok(items);
  }

  toDomainPaginated(raw: Paginated<TUserJson>): Result<Paginated<User>, Exceptions> {
    const result = this.toDomainMany(raw.items);
    if (isFailure(result)) return result;
    return ok(new Paginated(result.value, raw.total, raw.page, raw.pageSize));
  }
}
```

**Por que assim:**
- `toDomain` usa `User.assign()` — hidratação do banco (validação leve)
- `toPersistence` usa `user.toJSON()` — serializa para o banco
- Prefixo `Mapper` (não `UserMapper`)
- Mapper NÃO monta DTOs de response — isso é responsabilidade do controller

---

### 8. Repository (Infrastructure)

```typescript
// src/modules/user/infrastructure/repository-user-prisma.ts
import { ok, err, type ResultPromise, type Exceptions, ExceptionDb, FId } from "tyforge";
import type { Paginated, IPaginationParams } from "tyforge";
import type { PrismaClient } from "@prisma/client";
import type { IRepositoryUser } from "../domain/repository-user.interface";
import { User } from "../domain/user.aggregate";
import { MapperUser } from "../application/mapper-user";

export class RepositoryUserPrisma implements IRepositoryUser {
  private readonly mapper = new MapperUser();

  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: FId): ResultPromise<User | null, Exceptions> {
    try {
      const raw = await this.prisma.user.findUnique({ where: { id: id.getValue() } });
      if (!raw) return ok(null);
      return this.mapper.toDomain(raw);
    } catch (error) {
      return err(ExceptionDb.create("Failed to find user", error));
    }
  }

  async create(entity: User): ResultPromise<User, Exceptions> {
    try {
      const persistence = this.mapper.toPersistence(entity);
      if (!persistence.success) return persistence;
      await this.prisma.user.create({ data: persistence.value });
      return ok(entity);
    } catch (error) {
      return err(ExceptionDb.create("Failed to create user", error));
    }
  }

  // ... demais métodos do IRepositoryBase
}
```

**Por que assim:**
- Implementa interface do domain (Dependency Inversion)
- Usa Mapper para converter entre domain e persistência
- Erros de banco viram `ExceptionDb` — nunca throw genérico
- `ResultPromise` — async + Result pattern
- Prisma é detalhe de infraestrutura — domain não sabe que existe

---

### 9. API Route / Controller (Next.js)

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { Exceptions, isFailure } from "tyforge";
import { DtoReqCreateUser } from "@/modules/user/application/dtos/dto-req-create-user";
import { DtoResUserProfile } from "@/modules/user/application/dtos/dto-res-user-profile";
import { RegisterUserUseCase } from "@/modules/user/application/use-cases/register-user.use-case";
import { RepositoryUserPrisma } from "@/modules/user/infrastructure/repository-user-prisma";
import { prisma } from "@/config/prisma";

export async function POST(request: NextRequest) {
  // 1. Parse body
  const body = await request.json();

  // 2. Validate request via DTO
  const dtoResult = DtoReqCreateUser.create(body);
  if (isFailure(dtoResult)) {
    return NextResponse.json(
      { error: dtoResult.error.detail },
      { status: 400 },
    );
  }

  try {
    // 3. Execute use case
    const repository = new RepositoryUserPrisma(prisma);
    const useCase = new RegisterUserUseCase(repository);
    const user = await useCase.execute(dtoResult.value);

    // 4. Map to response DTO
    const responseResult = DtoResUserProfile.fromDomain(user);
    if (isFailure(responseResult)) {
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    // 5. Serialize with expose level (email hidden in public)
    const responseBody = responseResult.value.toJSON(undefined, "public");
    return NextResponse.json(responseBody, { status: 201 });

  } catch (error) {
    // 6. Handle domain/application exceptions
    if (error instanceof Exceptions) {
      return NextResponse.json(
        { error: error.detail },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Por que assim:**
- Controller é fino — só compõe: parse → validate → execute → respond
- Zero lógica de negócio aqui
- `DtoReqCreateUser.create(body)` valida input desconhecido
- `DtoResUserProfile.fromDomain(user)` monta a resposta
- `toJSON(undefined, "public")` esconde campos `expose: "private"` (email)
- Exceptions do domain são capturadas e convertidas em HTTP response

---

## Fluxo Completo de uma Request

```
HTTP POST /api/users { name: "João", email: "joao@test.com", age: 25 }

  1. route.ts (Controller)
     ├── request.json() → body: unknown
     ├── DtoReqCreateUser.create(body) → Result<DtoReqCreateUser>
     │   └── SchemaBuilder validates: FString, FEmail, FInt
     │       ├── TypeGuard.isString → narrowing + trim
     │       └── validateRules → minLength, maxLength, regex
     │
     ├── RegisterUserUseCase.execute(dto)
     │   ├── User.create({ name, email, age })
     │   │   ├── userValidator.create() → validates full schema
     │   │   ├── Business rules: age >= 18
     │   │   ├── FId.generate() → UUID v7
     │   │   ├── new User(props) → private constructor
     │   │   └── addDomainEvent(EventUserRegistered)
     │   │
     │   └── repository.create(user) → Prisma INSERT
     │
     ├── DtoResUserProfile.fromDomain(user) → Result<DtoRes>
     └── toJSON(config, "public") → { id, name, age, status }
                                      (email hidden: expose "private")

  HTTP 201 { id: "019d...", name: "João", age: 25, status: "active" }
```

---

## Princípios Aplicados

### SOLID

| Princípio | Como TyForge aplica |
|---|---|
| **S** — Single Responsibility | Cada classe tem uma responsabilidade: TypeField valida, Aggregate tem regras, UseCase orquestra, Mapper converte |
| **O** — Open/Closed | Novos TypeFields estendem `TypeField<T>` sem modificar a base. Novas regras de lint estendem `Rule` |
| **L** — Liskov Substitution | `Entity` substitui `ValueObject` em contextos que precisam de identidade. `Aggregate` substitui `Entity` |
| **I** — Interface Segregation | `IRepositoryRead` separado de `IRepositoryBase`. `IMapper` com métodos coesos |
| **D** — Dependency Inversion | UseCase depende de `IRepositoryUser` (interface), não de `RepositoryUserPrisma` (implementação) |

### Clean Code

| Regra | Enforcement |
|---|---|
| Sem `any` | `tyforge-lint` rule: no-any |
| Sem `as` cast | `tyforge-lint` rule: no-cast |
| Sem `!` assertion | `tyforge-lint` rule: no-non-null |
| Sem `export default` | `tyforge-lint` rule: no-export-default |
| Sem magic numbers HTTP | `tyforge-lint` rule: no-magic-http-status |
| Nomes em inglês | Convenção do projeto |
| Prefixos consistentes | F, T, I, O, Dto, DtoReq, DtoRes, Event, Exception, Repository, Mapper |

### Clean Architecture

| Camada | Responsabilidade | Depende de |
|---|---|---|
| **Domain** | Regras de negócio, Aggregates, Events | Nada (puro) |
| **Application** | Use Cases, DTOs, Mappers | Domain |
| **Infrastructure** | Repositories (Prisma), APIs externas | Domain (interfaces) |
| **Presentation** | Controllers (API routes) | Application |

---

## Configuração do Linter

```bash
# Verificar todos os arquivos
npx tyforge-lint --all

# Verificar apenas staged (pre-commit)
npx tyforge-lint --staged

# Auto-corrigir o que puder
npx tyforge-lint --fix

# Output JSON para CI
npx tyforge-lint --all --format json

# Configurar hooks de pre-commit
npx tyforge-lint --init
```

---

## Checklist de Refatoração

### Fase 1: Estrutura

- [ ] Criar pasta `src/modules/{modulo}/domain/`
- [ ] Criar pasta `src/modules/{modulo}/application/`
- [ ] Criar pasta `src/modules/{modulo}/infrastructure/`
- [ ] Mover lógica de negócio dos controllers para Aggregates
- [ ] Mover validação de input para DTOs com SchemaBuilder

### Fase 2: Domain

- [ ] Definir schemas com TypeFields (`satisfies ISchema`)
- [ ] Inferir tipos via `InferProps` / `InferJson` (nunca manual)
- [ ] Criar Aggregates com `create()` retornando `Result`
- [ ] Criar `assign()` para hidratação do banco
- [ ] Emitir Domain Events nos Aggregates
- [ ] Mover todas as regras de negócio para o domain

### Fase 3: Application

- [ ] Criar DTOs de request (`DtoReqCreateUser`)
- [ ] Criar DTOs de response (`DtoResUserProfile`)
- [ ] Criar Use Cases que recebem DTOs e retornam domain models
- [ ] Criar Mappers para conversão Domain ↔ Persistência
- [ ] Definir interfaces de Repository no domain

### Fase 4: Infrastructure

- [ ] Implementar Repositories (Prisma, MongoDB, etc.)
- [ ] Usar Mapper dentro do Repository
- [ ] Wrapping de erros em `ExceptionDb`

### Fase 5: Presentation

- [ ] Controllers finos: parse → validate → execute → respond
- [ ] Usar `toJSON(config, "public")` para respostas
- [ ] Capturar `Exceptions` e converter em HTTP status
- [ ] Zero lógica de negócio nos controllers

### Fase 6: Qualidade

- [ ] `npm run typecheck` — zero erros
- [ ] `npm run test` — zero falhas
- [ ] `npx tyforge-lint --all` — zero violações
- [ ] Zero `any`, `as`, `!`, `@ts-ignore`, `export default`
- [ ] Todos os TypeFields com prefixo `F`
- [ ] Todos os tipos com prefixo `T`
- [ ] Todas as interfaces com prefixo `I`
- [ ] Todas as exceptions com prefixo `Exception`
- [ ] Todos os events com prefixo `Event`

---

## Erros Comuns a Evitar

### 1. Lógica de negócio no controller

```typescript
// ERRADO
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.age < 18) return NextResponse.json({ error: "Too young" }); // regra no controller!
}

// CORRETO — regra no Aggregate
static create(data: TUserJson): Result<User, Exceptions> {
  if (result.value.age.getValue() < 18) {
    return err(ExceptionBusiness.invalidBusinessRule("User must be at least 18"));
  }
}
```

### 2. Tipos manuais em vez de inferidos

```typescript
// ERRADO
type TUserProps = { name: string; email: string; age: number };

// CORRETO — inferido do schema
type TUserProps = InferProps<typeof userSchema>;
```

### 3. Validação manual em vez de SchemaBuilder

```typescript
// ERRADO
if (typeof body.name !== "string") return error;
if (!body.email.includes("@")) return error;

// CORRETO
const result = validator.create(body);
if (isFailure(result)) return result;
```

### 4. new em TypeFields ou Domain Events

```typescript
// ERRADO
const id = new FId("...");
const event = new EventUserRegistered(...);

// CORRETO
const id = FId.create("...");
const event = EventUserRegistered.create({ ... });
```

### 5. throw no domain layer

```typescript
// ERRADO (dentro de Aggregate.create)
throw new Error("Invalid age");

// CORRETO
return err(ExceptionBusiness.invalidBusinessRule("Invalid age"));
```

### 6. Mapper montando DTO de response

```typescript
// ERRADO — mapper não deveria montar DTOs
class MapperUser {
  toResponse(user: User): DtoResUserProfile { ... } // NÃO
}

// CORRETO — controller monta o DTO de response
const response = DtoResUserProfile.fromDomain(user);
```

---

## Uso no Frontend (Client Components)

TyForge funciona no browser. TypeFields, SchemaBuilder, Result pattern — tudo roda no client:

```typescript
// Validação client-side com o mesmo schema do backend
"use client";
import { FString, FEmail, SchemaBuilder, isFailure, type ISchema } from "tyforge";

const formSchema = {
  name: { type: FString },
  email: { type: FEmail },
} satisfies ISchema;

const validator = SchemaBuilder.compile(formSchema);

export function validateForm(data: unknown) {
  const result = validator.create(data);
  if (isFailure(result)) {
    return { valid: false, error: result.error.detail };
  }
  return { valid: true, data: result.value };
}
```

**Vantagem:** Mesma validação no client e no server. Zero divergência.

---

## Referências

- [TyForge README](../README.md)
- [Exemplos canônicos](../src/examples/) (01 a 15)
- [Documentação de TypeFields](./docs/guia/type-fields/visao-geral.md)
- [Documentação de Config](./docs/guia/config/configuracao-global.md)
