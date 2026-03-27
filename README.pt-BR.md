# TyForge

[English](README.md)

[![npm version](https://img.shields.io/npm/v/tyforge)](https://www.npmjs.com/package/tyforge)
[![license](https://img.shields.io/npm/l/tyforge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D24-green)](https://nodejs.org/)

Validação de schemas type-safe, Result pattern e building blocks DDD para TypeScript.

**Zero boilerplate** — instale, importe, use. Cada validação, cada convenção de nomenclatura, cada padrão arquitetural já existe no TyForge. Você escreve lógica de domínio, não infraestrutura.

## Por que TyForge?

### Para humanos: código padronizado, zero debate

TyForge elimina um dos maiores custos ocultos em times de software: decidir como fazer as coisas.

Todo projeto que adota TyForge fala a mesma língua — mesmos prefixos, mesmas convenções, mesmo fluxo de validação e tratamento de erros. Um desenvolvedor familiarizado com TyForge consegue abrir qualquer projeto baseado nele e entender rapidamente toda a estrutura.

Isso vai além de estética. Quando validação, nomenclatura, regras de domínio e tratamento de erros já estão embutidos na biblioteca, desenvolvedores deixam de escrever código repetitivo e passam a focar exclusivamente na lógica de negócio.

O ganho é cumulativo:

- Onboarding mais rápido
- Code reviews mais objetivos
- Menos inconsistências
- Refatorações mais seguras

Porque todos os projetos seguem exatamente o mesmo modelo mental.

### Para IA: menos ambiguidade, melhores resultados

Assistentes de código com IA (Claude, Copilot, Cursor) funcionam melhor quando o ambiente é previsível. TyForge fornece exatamente isso: um conjunto fechado de padrões, regras e estruturas que eliminam ambiguidade.

Em vez de inferir convenções, a IA segue um sistema já definido — e validado pelo próprio código.

Na prática, isso resulta em:

- **Alta taxa de acerto na primeira tentativa** — o código gerado tende a compilar e passar nas validações sem ajustes, graças às restrições do sistema de tipos e do linter
- **Saída consistente** — independente do modelo ou da sessão, a estrutura gerada para Entities, UseCases e TypeFields segue o mesmo padrão
- **Autocorreção automática** — erros são rapidamente identificados por `tsc` e `tyforge-lint`, reduzindo iteração manual
- **Composição segura** — a IA consegue construir modelos complexos combinando TypeFields, schemas e eventos de domínio sem depender de contexto global

O resultado: menos tentativa e erro, mais código utilizável desde a primeira geração.

TyForge fornece a estrutura. A IA fornece a velocidade.

### Full-stack: uma única fonte de verdade

TyForge roda em qualquer lugar que tenha TypeScript — Node.js, Deno, Bun, Angular, React, Vue, Next.js, React Native, Electron. Os mesmos TypeFields que validam input na sua API validam formulários na sua UI.

Isso significa que:

- Validações não precisam ser reescritas
- Formatação não diverge entre cliente e servidor
- Regras de negócio não ficam espalhadas

Uma única definição de schema se torna a fonte de verdade para toda a stack.

TyForge centraliza as regras. Ambos os lados apenas consomem.

## Instalação

```bash
npm install tyforge
```

## Quick Start

### Validação de schema com inferência automática de tipos

```typescript
import { SchemaBuilder, FString, FEmail, FInt, isSuccess } from "tyforge";
import type { ISchema, InferProps, InferJson } from "tyforge";

const userSchema = {
  name:  { type: FString },
  email: { type: FEmail },
  age:   { type: FInt, required: false },
} satisfies ISchema;

// Tipos inferidos automaticamente — zero anotação manual
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

### Result pattern — error handling funcional

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
    value => `Resultado: ${value}`,
    error => `Erro: ${error.message}`,
  );
// "Resultado: 100"
```

### TypeFields — Value Objects validados

```typescript
import { FEmail, FDocumentCpf, FCurrency, FPassword, TypeField } from "tyforge";

// Todo TypeField valida na criação
const email = FEmail.createOrThrow("user@company.com");
email.getValue();  // "user@company.com"
email.formatted(); // "user@company.com"

// CPF com validação de dígitos verificadores (mod 11)
const cpf = FDocumentCpf.createOrThrow("52998224725");
cpf.formatted(); // "529.982.247-25" (máscara progressiva)

// Senha com regras de complexidade (maiúscula, minúscula, dígito, especial, 8+ chars)
const pwd = FPassword.createOrThrow("S3cur3!Pass");

// Moeda com formatação locale-aware
TypeField.configure({ localeDisplay: "br" });
const price = FCurrency.createOrThrow(1234.50);
price.getValue();       // 123450 (armazenado como centavos inteiros)
price.toDecimalValue(); // 1234.5
price.formatted();      // "1.234,50" (formato brasileiro)
```

### Aritmética monetária — zero problemas de ponto flutuante

```typescript
import { FMoney, FCurrency } from "tyforge";

const a = FCurrency.createOrThrow(0.1);
const b = FCurrency.createOrThrow(0.2);
const sum = a.add(b);
// 0.1 + 0.2 = 0.30 (não 0.30000000000000004)
// Internamente: 10 + 20 = 30 centavos

const price = FMoney.createOrThrow(1050);  // 1050 centavos
price.toDecimal();    // 10.50
price.isPositive();   // true
price.isZero();       // false

const discount = FMoney.createOrThrow(200);
const final = price.subtract(discount); // 850 centavos
```

### Domain Models — Entity, Aggregate, Domain Events

```typescript
import { SchemaBuilder, FId, FString, FEmail, ok, isSuccess, isFailure } from "tyforge";
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

### Expose / Redaction — controle de saída JSON

```typescript
const schema = {
  name:     { type: FString },
  email:    { type: FEmail, expose: "private" },
  password: { type: FPassword, expose: "redacted" },
} satisfies ISchema;

// toJSON() ou toJSON(config, "public") — oculta private + redacted
// => { name: "Maria" }

// toJSON(config, "private") — mostra private, oculta redacted
// => { name: "Maria", email: "maria@email.com" }

// toJSON(config, "redacted") — mostra tudo
// => { name: "Maria", email: "maria@email.com", password: "S3cur3!Pass" }
```

### Sistema de locale — display + regras, configurados independentemente

```typescript
import { TypeField, FBankCode, FCurrency, FDocumentCpf } from "tyforge";

// Configurar separadamente: como exibir vs quais regras aplicar
TypeField.configure({ localeDisplay: "br", localeRules: "br" });

// localeRules: "br" → exige formato ISPB de 8 dígitos
FBankCode.createOrThrow("60701190"); // OK (ISPB do Itaú)

// localeDisplay: "br" → formata com separadores brasileiros
FCurrency.createOrThrow(1234.50).formatted(); // "1.234,50"

// Tipos estritos (TLocaleDisplay, TLocaleRules) com exhaustive switch:
// adicionar um novo locale causa erros de compilação onde o tratamento está faltando
```

### Normalização de input de formulário

```typescript
import { FCurrency, FInt } from "tyforge";

// formCreate/formAssign normalizam inputs string de formulários HTML
FCurrency.formCreate("1234,50");  // "1234,50" → 1234.50 → 123450 centavos
FInt.formCreate("42");            // "42" → 42
FInt.formCreate("0x1A");          // rejeitado (hex não permitido)
FInt.formCreate("1e5");           // rejeitado (notação científica não permitida)
```

### Validação em lote com workers paralelos

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

// Sequencial
const result = await batchCreate(schema, items);

// Paralelo com 4 worker threads
const result = await batchCreate(schema, items, { concurrency: 4 });
// result.successes: itens validados
// result.errors: itens que falharam com índice + detalhe do erro
```

### Exceptions — RFC 7807 com stack trace lazy

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

// Stack trace capturado apenas quando acessado (lazy) — custo zero em validação em lote
```

### Schemas aninhados e arrays

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

// Validação profundamente aninhada com paths indexados:
// "items[2].price" → "Value must be an integer (cents)"
```

### Linter — impõe convenções automaticamente

```bash
npx tyforge-lint              # verifica todos os .ts
npx tyforge-lint --staged     # verifica apenas arquivos staged
npx tyforge-lint --fix        # auto-corrige o que for possível
npx tyforge-lint --init       # configura pre-commit hooks (Husky/Lefthook/nativo)
```

10 regras: `no-any`, `no-cast`, `no-non-null`, `no-ts-ignore`, `no-export-default`, `no-to-json-lowercase`, `no-new-type-field`, `no-magic-http-status`, `no-declare`, `no-satisfies-without-prefix`.

## Módulos

| Módulo | Descrição |
|--------|-----------|
| **Result Pattern** | `ok()`, `err()`, `map`, `flatMap`, `fold`, `match`, `all`, `allSettled`, `toPromise` — error handling funcional com zero exceções |
| **Schema Builder** | Validação compilada de schemas com inferência `InferProps`/`InferJson`, objetos aninhados, arrays, `batchCreate`, `composeSchema` |
| **Type Fields** | 50+ Value Objects validadores — strings, emails, moeda, bancário, documentos, PIX, segurança, enums, datas, identificadores |
| **Domain Models** | Entity, ValueObject, Aggregate (com domain events), Dto, DtoReq, DtoRes — building blocks DDD completos |
| **Exceptions** | 18 tipos RFC 7807 com stack trace lazy e constantes `OHttpStatus` |
| **Application** | UseCase, IMapper, Saga, DomainEventDispatcher, interfaces CQRS |
| **Infrastructure** | IRepositoryBase, IRepositoryRead, Paginated, IUnitOfWork, IOutbox |
| **Tools** | TypeGuard, ToolObjectTransform (flatten/unflatten), ToolCliParser, ToolFileDiscovery, ToolGit |
| **Linter** | `npx tyforge-lint` — 10 regras com `--init` / `--fix` / `--format json` para CI |
| **Config** | `tyforge.config.json` — níveis de validação global (`full`, `type`, `none`) e configurações do linter |

### Type Fields por Categoria

| Categoria | Campos |
|-----------|--------|
| **Strings** | FString, FText, FDescription, FFullName, FBusinessName, FEmail |
| **Numéricos** | FInt, FFloat, FPageNumber, FPageSize |
| **Moeda** | FMoney (centavos inteiros), FCurrency (conveniência decimal) — aritmética, comparações, `fromDecimal()` |
| **Datas** | FDate, FDateISODate, FDateTimeISOZ, FDateTimeISOZMillis, FDateISOCompact, FDateTimeISOCompact, FDateTimeISOFullCompact |
| **Identificadores** | FId, FIdReq, FTransactionId, FDeviceId, FCorrelationId, FReconciliationId, FIdempotencyKey, FCertificateThumbprint |
| **Documentos** | FDocumentCpf, FDocumentCnpj, FDocumentCpfOrCnpj, FDocumentRg, FDocumentId, FDocumentType, FDocumentStateRegistration, FDocumentMunicipalRegistration |
| **Bancário** | FBankCode, FBankBranch, FBankAccountNumber, FBankNsu, FBankE2eId, FEmvQrCodePayload |
| **PIX** | FPixKey, FPixKeyType |
| **Segurança** | FApiKey, FBearer, FPassword, FSignature, FPublicKeyPem, FTotpCode, FTotpSecret, FHashAlgorithm |
| **Enums** | FAppStatus, FHttpStatus, FBoolInt, FPersonType, FGender, FMaritalStatus, FTransactionStatus, FStateCode |
| **Outros** | FBoolean, FJson, FTraceId |

### Subpath Exports

```typescript
import { ok, err } from "tyforge/result";
import { FString, FEmail } from "tyforge/type-fields";
import { ExceptionValidation } from "tyforge/exceptions";
import { SchemaBuilder } from "tyforge/schema";
import { TypeGuard } from "tyforge/tools";
```

## Documentação

Documentação completa em [tyforge.navegarsistemas.com.br](https://tyforge.navegarsistemas.com.br).

## Licença

MIT - [Navegar Sistemas](https://navegarsistemas.com.br/)
