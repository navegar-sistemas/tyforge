---
title: Arquitetura
sidebar_position: 1
---

import MermaidDiagram from '@site/src/components/MermaidDiagram';

# Visão Geral da Arquitetura

O TyForge é organizado em camadas com dependências unidirecionais. Cada módulo superior depende apenas dos módulos abaixo dele, garantindo isolamento e testabilidade.

## Diagrama de dependências

<MermaidDiagram chart={`
graph TD
  Result["Result Pattern<br/><i>base, sem dependências</i>"]
  Exceptions["Exceptions<br/><i>depende de Result, HTTP constants</i>"]
  Tools["Tools<br/><i>TypeGuard, ToolObjectTransform, ToolCliParser</i>"]
  TypeFields["Type Fields<br/><i>depende de Result, Exceptions, TypeGuard</i>"]
  Schema["Schema Builder<br/><i>depende de TypeFields, Result, Exceptions</i>"]
  DomainModels["Domain Models<br/><i>depende de TypeFields, Result</i>"]
  Application["Application<br/><i>UseCase, IMapper, CQRS</i>"]
  Infrastructure["Infrastructure<br/><i>IRepositoryBase, Paginated, IUnitOfWork</i>"]

  Result --> Exceptions
  Result --> Tools
  Result --> TypeFields
  Result --> Schema
  Result --> DomainModels
  Result --> Application
  Result --> Infrastructure
  Exceptions --> TypeFields
  Exceptions --> Schema
  Exceptions --> Application
  Exceptions --> Infrastructure
  Tools --> TypeFields
  TypeFields --> Schema
  TypeFields --> DomainModels
  DomainModels --> Application
  DomainModels --> Infrastructure
  Schema --> Application
`} />

### Direção das dependências

- **Result** é a camada base — não depende de nenhum outro módulo interno.
- **Exceptions** depende apenas de Result e das constantes HTTP.
- **Tools** (TypeGuard, ToolObjectTransform, ToolCliParser, ToolFileDiscovery, ToolGit) são utilitários puros usados em várias camadas.
- **Type Fields** consome Result, Exceptions e TypeGuard para validar e encapsular valores primitivos.
- **Schema Builder** orquestra TypeFields, Result e Exceptions para compilar e executar validações.
- **Domain Models** utiliza TypeFields e Result para construir Entity, ValueObject, Aggregate e Dto.
- **Application** contém UseCase e IMapper, orquestrando Domain Models e Schemas para casos de uso da aplicação.
- **Infrastructure** define interfaces de repositório, paginação e Unit of Work para a camada de persistência.

## Princípios de arquitetura

### Result over throw

Caminhos quentes (hot paths) utilizam `Result<T, E>` para controle de fluxo. Exceções via `throw` são reservadas exclusivamente para os métodos `createOrThrow`, destinados a contextos onde o chamador prefere capturar via try/catch.

```typescript
// Hot path — retorna Result
const result = FEmail.create("usuario@email.com");

// Conveniência — lança exceção se falhar
const email = FEmail.createOrThrow("usuario@email.com");
```

### Imutabilidade

Singletons como `OK_TRUE` são congelados com `Object.freeze()` para evitar mutação acidental e eliminar alocações desnecessárias no hot path de validação.

```typescript
export const OK_TRUE: Result<true, never> = Object.freeze({
  success: true as const,
  value: true,
});
```

### Lazy stack traces

As exceções do TyForge capturam o stack trace apenas quando a propriedade `.stack` é acessada pela primeira vez. Isso evita o custo de captura em cenários onde o stack não é necessário (ex.: validações em massa).

### Compilação de schemas

O `SchemaBuilder.compile()` analisa o schema uma única vez e gera um validador otimizado. Chamadas subsequentes a `.create()` e `.assign()` executam a validação sem re-analisar a estrutura do schema.

```typescript
// Compila uma vez
const validator = SchemaBuilder.compile(userSchema);

// Executa N vezes sem re-compilação
const r1 = validator.create(data1);
const r2 = validator.create(data2);
```

### Composição

TypeFields se compõem em Entities, que se compõem em Aggregates. Cada nível reutiliza a validação da camada inferior via Result, formando uma cadeia de validação composicional.

## Estrutura do código-fonte

```
src/
  result/          — Result<T, E>, ok(), err(), map, flatMap, fold, match, all
  exceptions/      — 18 tipos de exceção RFC 7807
  type-fields/     — TypeField<TPrimitive, TFormatted> e 50+ implementações
  schema/          — SchemaBuilder.compile() e tipos de inferência
  domain-models/   — Entity, ValueObject, Aggregate, Dto, DomainEvent
  application/     — UseCase, IMapper, CQRS
  infrastructure/  — IRepositoryBase, Paginated, IUnitOfWork
  tools/           — TypeGuard, ToolObjectTransform, ToolCliParser, ToolFileDiscovery, ToolGit
  config/          — loadTyForgeConfig(), ITyForgeConfig
  lint/            — tyforge-lint CLI e regras
  index.ts         — re-exportações públicas
```

### Descrição dos diretórios

| Diretório | Responsabilidade |
|-----------|-----------------|
| `result/` | Tipo `Result<T, E>` e funções utilitárias (`ok`, `err`, `isSuccess`, `isFailure`, `map`, `flatMap`, `fold`, `match`, `getOrElse`, `orElse`, `all`, `toPromise`) |
| `exceptions/` | 18 tipos de exceção baseados em RFC 7807 (`ExceptionValidation`, `ExceptionBusiness`, `ExceptionNotFound`, `ExceptionDb`, `ExceptionAuth`, `ExceptionUnexpected` e outros) |
| `type-fields/` | Classe base `TypeField<TPrimitive, TFormatted>` e 50+ implementações concretas como `FString`, `FEmail`, `FId`, `FInt`, `FBoolean`, `FDate*`, `FMoney`, `FPassword`, `FPixKey`, `FDocumentCpf` etc. |
| `schema/` | `SchemaBuilder` com método `compile()`, tipos de inferência `InferJson` e `InferProps`, batch processing |
| `domain-models/` | Classes base `Entity`, `ValueObject`, `Aggregate` (com domain events), `Dto` e `DomainEvent` |
| `application/` | `UseCase` (recebe Dto, retorna domain model), `IMapper` (conversão Domain/Persistência), CQRS |
| `infrastructure/` | `IRepositoryBase<T>` com `findAll(params?: IPaginationParams)`, `Paginated<T>`, `IUnitOfWork` |
| `tools/` | Utilitários: `TypeGuard` (verificações de tipo), `ToolObjectTransform` (flatten/unflatten de objetos), `ToolCliParser` (parsing de argumentos CLI), `ToolFileDiscovery` (busca de arquivos por extensão), `ToolGit` (operações git) |
| `config/` | Sistema de configuração global: `loadTyForgeConfig()`, `ITyForgeConfig`, `tyforge.config.json` |
| `lint/` | Linter de padrões: `tyforge-lint` CLI, `RuleRegistry`, regras de verificação, reporters |

## Build

```bash
npm run build
```

O comando executa `tsc && tsc-alias`:

1. **tsc** — compila TypeScript para JavaScript (CommonJS, ES2022) com declaration maps.
2. **tsc-alias** — resolve os path aliases `@tyforge/*` para caminhos relativos no output.

### Path aliases

Os aliases são definidos no `tsconfig.json`:

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
| Diretório | `dist/` |
| Declarations | `.d.ts` com declaration maps |
| Source maps | Habilitados |
