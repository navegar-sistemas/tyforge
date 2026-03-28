---
title: Convenções
sidebar_position: 6
---

# Convenções

Este guia documenta todas as convenções de nomenclatura, padrões de arquivo e proibições que devem ser seguidas ao contribuir com o TyForge.

## Prefixos obrigatórios

Todos os identificadores públicos devem seguir o sistema de prefixos abaixo. O prefixo comunica imediatamente a natureza do artefato.

| Prefixo | Uso | Exemplo |
|---------|-----|---------|
| `F` | TypeFields (Value Objects validadores) | `FString`, `FEmail`, `FId`, `FMoney` |
| `T` | Types (type aliases) | `TUserProps`, `TUserJson`, `TFloat` |
| `I` | Interfaces | `ISchema`, `IMapper`, `IRepositoryBase` |
| `O` | Objetos const enum (`as const`) | `OAppStatus`, `OHttpStatus`, `OGender` |
| `E` | Pure const enums (TS `const enum`) | `EFieldKind` |
| `Dto` | DTOs genéricos | `DtoCreateUser` |
| `DtoReq` | DTOs de request | `DtoReqCreateUser`, `DtoReqLogin` |
| `DtoRes` | DTOs de response | `DtoResUserProfile` |
| `Exception` | Exceptions | `ExceptionBusiness`, `ExceptionOptimisticLock` |
| `Event` | Domain Events | `EventOrderCreated`, `EventUserRegistered` |
| `Repository` | Repositórios (prefixo, não sufixo) | `RepositoryUser`, `RepositoryOrder` |
| `Mapper` | Mappers | `MapperUser`, `OrmMapperUser` |

### Diferença entre `O` e `E`

- **`O` (objeto const):** usado para objetos definidos com `as const`. Ex: `const OGender = { MALE: "MALE", FEMALE: "FEMALE" } as const;`
- **`E` (const enum):** usado para `const enum` puro do TypeScript. Ex: `const enum EFieldKind { STRING, NUMBER }`

## Padrões de arquivo

| Tipo de artefato | Padrão de nome | Exemplo |
|-----------------|----------------|---------|
| TypeField | `{nome-em-ingles}.format_vo.ts` | `email.format_vo.ts`, `money.format_vo.ts` |
| Teste | `*.test.ts` dentro de `__tests__/` | `currency.test.ts`, `rules.test.ts` |
| Exception | `{nome}.exception.ts` | `validation.exception.ts` |
| Regra do linter | `{nome}.rule.ts` | `no-any.rule.ts` |

## Proibições em código de produção

Código de produção deve seguir **todas** as proibições abaixo sem exceção. Workarounds como casts, supressões de lint ou verificações manuais de tipo são proibidos quando uma solução adequada existe.

### Zero `any`

Nunca usar `any` como tipo. Utilizar `unknown` quando o tipo é desconhecido e fazer narrowing adequado com `TypeGuard`.

### Zero `as` para cast

Nunca usar `as` para conversão de tipo. A única exceção é `as const` para declaração de objetos constantes.

```typescript
// Proibido
const value = input as string;

// Permitido
const OStatus = { ACTIVE: "active" } as const;
```

### Zero `!` (non-null assertion)

Nunca usar o operador `!` para afirmar que um valor não é `null` ou `undefined`. Tratar a possibilidade de nulidade explicitamente.

### Zero `@ts-ignore` / `@ts-expect-error`

Nunca suprimir erros do compilador TypeScript. Se há um erro de tipo, corrigir o código.

### Zero `export default`

Sempre usar named exports. O linter `no-export-default` reforça esta regra e pode auto-corrigir.

```typescript
// Proibido
export default class User { }

// Correto
export class User { }
```

### Zero `declare` em classes

Nunca usar `declare` para declarar propriedades de classe. Usar `readonly` com inicialização no constructor.

### Zero magic numbers para HTTP status

Nunca usar números literais para status HTTP. Usar o objeto `OHttpStatus`:

```typescript
// Proibido
if (status === 404) { ... }

// Correto
if (status === OHttpStatus.NOT_FOUND) { ... }
```

### Zero `prettier-ignore`

Nunca usar `// prettier-ignore` ou `/* prettier-ignore */`. As regras de formatação devem ser respeitadas. Se a formatação automática produz resultado indesejado, ajustar o código.

### Zero `tyforge-lint-disable`

Nunca usar `tyforge-lint-disable-line` ou `tyforge-lint-disable-next-line` para suprimir violações. Se o linter acusa uma violação, corrigir o código.

### Zero arquivos utilitários avulsos

Nunca criar arquivos `*.util.ts` ou `*.helper.ts` em `type-fields/`. Lógica compartilhada entre TypeFields deve ser implementada na classe base `TypeField` como método estático.

### Zero `typeof` manual

Nunca usar `typeof` diretamente para validação de tipos primitivos. Usar `TypeGuard`:

```typescript
// Proibido
if (typeof value === "string") { ... }

// Correto
const result = TypeGuard.isString(value, fieldPath);
```

### Zero numeric separators

Nunca usar underscore como separador numérico. Escrever o número completo:

```typescript
// Proibido
const timeout = 30_000;

// Correto
const timeout = 30000;
```

### Outras proibições

- Zero constructor público em domain models (usar `private` ou `protected`)
- Zero `new` para domain events (usar `static create()`)
- Zero `new` para TypeFields (usar `create()` ou `createOrThrow()`)
- Zero primitivos como input de UseCase (usar `Dto` ou `DtoReq`)
- Zero primitivos como output de UseCase (retornar domain model)
- Zero chamada direta ao `SchemaBuilder` fora de DTOs, Aggregates, Entities ou ValueObjects

## Regras gerais

### Idioma

- Código, comentários e nomes de identificadores em **inglês**
- Mensagens de exceção voltadas ao usuário podem estar em português
- Documentação do projeto em português

### Nomenclatura de métodos

- `toJSON()` — sempre com JSON em maiúsculas, nunca `toJson()`
- `satisfies ISchema` — sempre com prefixo `I`, nunca `satisfies Schema`

### Inferência de tipos

Tipos devem sempre ser inferidos a partir do schema, nunca definidos manualmente:

```typescript
const schema = {
  name: { type: FString },
  email: { type: FEmail },
} satisfies ISchema;

// Correto: inferir do schema
type TUserProps = InferProps<typeof schema>;
type TUserJson = InferJson<typeof schema>;

// Proibido: definir manualmente
type TUserProps = { name: FString; email: FEmail }; // Nunca
```

## Segurança

### TypeFields sensíveis

TypeFields que tratam dados sensíveis preservam whitespace (não fazem trim):

- `FPassword` — senhas
- `FBearer` — tokens de autenticação
- `FSignature` — assinaturas digitais
- `FPublicKeyPem` — chaves públicas PEM

### Proteção contra prototype pollution

`ToolObjectTransform.unflatten()` rejeita chaves `__proto__`, `constructor` e `prototype` para prevenir ataques de prototype pollution.

### JSON.parse seguro

Todo `JSON.parse()` em carregamento de configuração é envolvido em `try-catch` para evitar crashes com arquivos malformados.

### Redação de campos sensíveis

Campos sensíveis utilizam `expose: "redacted"` no schema, nunca override de `toJSON()` no TypeField:

```typescript
const schema = {
  name: { type: FString },                          // público por padrão
  email: { type: FEmail, expose: "private" },        // oculto na saída pública
  password: { type: FString, expose: "redacted" },   // oculto em todas as saídas exceto "redacted"
} satisfies ISchema;
```

Controle de visibilidade via `toJSON(config?, exposeLevel?)`:

| Chamada | Comportamento |
|---------|---------------|
| `toJSON()` ou `toJSON(config, "public")` | Redacta campos `private` e `redacted` |
| `toJSON(config, "private")` | Redacta apenas campos `redacted` |
| `toJSON(config, "redacted")` | Exibe todos os campos |

## Qualidade obrigatória

Antes de considerar qualquer trabalho como concluído, verificar:

1. `npm run typecheck` -- zero erros
2. `npm run test` -- zero falhas
3. `npx tyforge-lint` -- zero erros **e** zero warnings

Não existe exceção. Código deve seguir todas as convenções documentadas nesta página.
