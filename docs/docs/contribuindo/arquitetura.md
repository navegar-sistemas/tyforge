---
title: Arquitetura
sidebar_position: 1
---

import MermaidDiagram from '@site/src/components/MermaidDiagram';

# Visao Geral da Arquitetura

O TyForge e organizado em camadas com dependencias unidirecionais. Cada modulo superior depende apenas dos modulos abaixo dele, garantindo isolamento e testabilidade.

## Diagrama de dependencias

<MermaidDiagram chart={`
graph TD
  Result["Result Pattern<br/><i>base, sem dependencias</i>"]
  Exceptions["Exceptions<br/><i>depende de Result, HTTP constants</i>"]
  Tools["Tools<br/><i>TypeGuard, ToolParse, ToolFormatting</i>"]
  TypeFields["Type Fields<br/><i>depende de Result, Exceptions, TypeGuard</i>"]
  Schema["Schema Builder<br/><i>depende de TypeFields, Result, Exceptions</i>"]
  DomainModels["Domain Models<br/><i>depende de TypeFields, Result</i>"]

  Result --> Exceptions
  Result --> Tools
  Result --> TypeFields
  Result --> Schema
  Result --> DomainModels
  Exceptions --> TypeFields
  Exceptions --> Schema
  Tools --> TypeFields
  TypeFields --> Schema
  TypeFields --> DomainModels
`} />

### Direcao das dependencias

- **Result** e a camada base — nao depende de nenhum outro modulo interno.
- **Exceptions** depende apenas de Result e das constantes HTTP.
- **Tools** (TypeGuard, ToolParse, ToolFormattingDateISO8601) sao utilitarios puros usados em varias camadas.
- **Type Fields** consome Result, Exceptions e TypeGuard para validar e encapsular valores primitivos.
- **Schema Builder** orquestra TypeFields, Result e Exceptions para compilar e executar validacoes.
- **Domain Models** utiliza TypeFields e Result para construir Entity, ValueObject, Aggregate e Dto.

## Principios de arquitetura

### Result over throw

Caminhos quentes (hot paths) utilizam `Result<T, E>` para controle de fluxo. Excecoes via `throw` sao reservadas exclusivamente para os metodos `createOrThrow`, destinados a contextos onde o chamador prefere capturar via try/catch.

```typescript
// Hot path — retorna Result
const result = FEmail.create("usuario@email.com");

// Conveniencia — lanca excecao se falhar
const email = FEmail.createOrThrow("usuario@email.com");
```

### Imutabilidade

Singletons como `OK_TRUE` sao congelados com `Object.freeze()` para evitar mutacao acidental e eliminar alocacoes desnecessarias no hot path de validacao.

```typescript
export const OK_TRUE: Result<true, never> = Object.freeze({
  success: true as const,
  value: true,
});
```

### Lazy stack traces

As excecoes do TyForge capturam o stack trace apenas quando a propriedade `.stack` e acessada pela primeira vez. Isso evita o custo de captura em cenarios onde o stack nao e necessario (ex.: validacoes em massa).

### Compilacao de schemas

O `SchemaBuilder.compile()` analisa o schema uma unica vez e gera um validador otimizado. Chamadas subsequentes a `.create()` e `.assign()` executam a validacao sem re-analisar a estrutura do schema.

```typescript
// Compila uma vez
const validator = SchemaBuilder.compile(userSchema);

// Executa N vezes sem re-compilacao
const r1 = validator.create(data1);
const r2 = validator.create(data2);
```

### Composicao

TypeFields se compoem em Entities, que se compoem em Aggregates. Cada nivel reutiliza a validacao da camada inferior via Result, formando uma cadeia de validacao composicional.

## Estrutura do codigo-fonte

```
src/
  result/          — Result<T, E>, ok(), err(), map, flatMap, fold, match, all
  exceptions/      — 18 tipos de excecao RFC 7807
  type-fields/     — TypeField<TPrimitive, TFormatted> e 25+ implementacoes
  schema/          — SchemaBuilder.compile() e tipos de inferencia
  domain-models/   — Entity, ValueObject, Aggregate, Dto, DomainEvent
  tools/           — TypeGuard, ToolParse, ToolFormattingDateISO8601
  constants/       — OHttpStatus, THttpStatus
  index.ts         — re-exportacoes publicas
```

### Descricao dos diretorios

| Diretorio | Responsabilidade |
|-----------|-----------------|
| `result/` | Tipo `Result<T, E>` e funcoes utilitarias (`ok`, `err`, `isSuccess`, `isFailure`, `map`, `flatMap`, `fold`, `match`, `getOrElse`, `orElse`, `all`, `toPromise`) |
| `exceptions/` | 18 tipos de excecao baseados em RFC 7807 (`ExceptionValidation`, `ExceptionBusiness`, `ExceptionNotFound`, `ExceptionDb`, `ExceptionAuth`, `ExceptionUnexpected` e outros) |
| `type-fields/` | Classe base `TypeField<TPrimitive>` e implementacoes concretas como `FString`, `FEmail`, `FId`, `FInt`, `FBoolean`, `FDate*`, `FPassword`, etc. |
| `schema/` | `SchemaBuilder` com metodos `compile()` e `build()`, tipos de inferencia `InferJson` e `InferProps` |
| `domain-models/` | Classes base `Entity`, `ValueObject`, `Aggregate` (com domain events), `Dto` e `DomainEvent` |
| `tools/` | Utilitarios: `TypeGuard` (verificacoes de tipo), `ToolParse` (parsing seguro), `ToolFormattingDateISO8601` (formatacao de datas) |
| `constants/` | Constantes HTTP: `OHttpStatus` (objeto com status codes) e `THttpStatus` (tipo) |

## Build

```bash
npm run build
```

O comando executa `tsc && tsc-alias`:

1. **tsc** — compila TypeScript para JavaScript (CommonJS, ES2022) com declaration maps.
2. **tsc-alias** — resolve os path aliases `@tyforge/*` para caminhos relativos no output.

### Path aliases

Os aliases sao definidos no `tsconfig.json`:

```json
{
  "paths": {
    "@tyforge/*": ["src/*"]
  }
}
```

Durante o desenvolvimento, `@tyforge/result` resolve para `src/result`. No build, `tsc-alias` converte para caminhos relativos (`./result`).

### Output

| Propriedade | Valor |
|-------------|-------|
| Formato | CommonJS |
| Target | ES2022 |
| Diretorio | `dist/` |
| Declarations | `.d.ts` com declaration maps |
| Source maps | Habilitados |
