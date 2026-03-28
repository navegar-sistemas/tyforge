---
title: Desenvolvimento
sidebar_position: 3
---

# Desenvolvimento

## Pré-requisitos

- Node.js >= 24
- npm

## Setup

```bash
git clone https://github.com/navegar-sistemas/tyforge.git
cd tyforge
npm install
```

## Comandos principais

| Comando | Descrição |
|---------|-----------|
| `npm run build` | `tsdown` — compila TypeScript e resolve path aliases |
| `npm run typecheck` | `tsc --noEmit` — verificação de tipos sem emitir arquivos |
| `npm run test` | `tsx --test src/**/*.test.ts` — executa todos os testes |
| `npx tyforge-lint` | Linter de padrões do TyForge |
| `npx tyforge-lint --fix` | Auto-correção de violações do linter |

## Documentação local

### Docusaurus (porta 4200)

```bash
cd docs && npm install && npm run start
```

### Docker (porta 4200)

```bash
cd docs && docker compose up
```

## Pre-commit hooks

O projeto usa Husky para executar verificações automáticas antes de cada commit. Os hooks são instalados automaticamente via `npm install` (script `"prepare": "husky"`).

O pre-commit é implementado em **TypeScript OOP** no diretório `src/pre-commit/`, não como shell script. Cada check é uma classe que estende `Check`, com reporters para formatação de output.

Os 7 checks (6 blocking + 1 confirmable) executados no pre-commit:

1. **typecheck** — `npm run typecheck`
2. **tests** — `npm run test`
3. **tyforge-lint** — `npx tyforge-lint`
4. **docs build local** — build da documentação Docusaurus
5. **docs Docker build** — build da documentação via Docker
6. **deprecated packages** — verificação de pacotes deprecated
7. **version checks** — verificação de versões (outdated, audit, Docker images, pinned versions)

## Estrutura do source

```
src/
├── result/          — Result<T, E>
├── exceptions/      — Tipos RFC 7807
├── type-fields/     — TypeField<TPrimitive, TFormatted> e implementações
├── schema/          — SchemaBuilder.compile(), batch processing
├── domain-models/   — Entity, ValueObject, Aggregate, Dto, DomainEvent
├── application/     — UseCase, IMapper, CQRS
├── infrastructure/  — IRepositoryBase, Paginated, IUnitOfWork
├── tools/           — TypeGuard, ToolObjectTransform, ToolCliParser, ToolFileDiscovery, ToolGit
├── config/          — loadTyForgeConfig(), ITyForgeConfig
├── lint/            — tyforge-lint CLI e regras
├── pre-commit/      — Pre-commit hooks em TypeScript OOP
└── index.ts         — API pública
```

## Path aliases

O projeto usa `@tyforge/*` como alias para `src/*`, configurado no `tsconfig.json`:

```json
{
  "paths": {
    "@tyforge/*": ["src/*"]
  }
}
```

O `tsdown` resolve path aliases automaticamente no output `dist/`.

## Output

- **Formato**: ESM
- **Target**: ES2022
- **Saída**: `dist/`
- **Declarações**: `.d.ts` com declaration maps
- **Source maps**: desabilitados (produção)

## Dependências

| Pacote | Tipo | Uso |
|--------|------|-----|
| `uuid` | runtime | `FId.generate()` e `DomainEvent` |
| `typescript` | dev | Compilador TypeScript |
| `tsdown` | dev | Bundler TypeScript com resolução de path aliases |
| `tsx` | dev | Execução de testes TypeScript |
| `zod` | benchmark/ | Benchmarks comparativos (package.json separado) |
| `husky` | dev | Pre-commit hooks |

## Mudanças recentes

### Migração para ESM

O `package.json` agora define `"type": "module"`. Toda a codebase é ESM nativo:

- **Bundler**: `tsdown` em vez de `tsc` + `tsc-alias`. O `tsdown` resolve path aliases e gera output ESM em um único passo
- **Imports**: `import.meta.url` em vez de `__dirname` (que não existe em ESM)
- **Exports**: apenas `import`/`types` no campo `exports` do `package.json` (sem `require`)

### TypeScript 6.0.2

Major upgrade do compilador. Zero breaking changes para o `tsconfig.json` atual do projeto. Todas as dependências (`@types/node`, `@docusaurus/tsconfig`) foram atualizadas em conjunto.

### uuid v13

O `uuid` v13 é ESM-only. O `@types/uuid` foi removido porque os tipos agora estão inclusos diretamente no pacote. Nenhuma mudança na API pública — `FId.generate()` continua funcionando normalmente.

### React 19.2.4

Major upgrade do React. O Docusaurus 3.9.2 suporta React 19 nativamente. O `react` e `react-dom` foram atualizados juntos para `19.2.4`.

### Versões pinadas

Todos os `package.json` do projeto (raiz e `docs/`) usam versões exatas sem `^` ou `~`:

```json
{
  "dependencies": {
    "uuid": "13.0.0"
  },
  "devDependencies": {
    "typescript": "6.0.2",
    "tsdown": "0.21.6"
  }
}
```

Isso garante builds reproduzíveis e evita surpresas de versões flutuantes.

### Override de serialize-javascript

O `docs/package.json` define um override para o `serialize-javascript`:

```json
{
  "overrides": {
    "serialize-javascript": "7.0.5"
  }
}
```

Esse override resolve 19 vulnerabilidades HIGH que vinham de dependências transitivas do Docusaurus. O `serialize-javascript` 7.0.5 corrige as vulnerabilidades sem breaking changes.

### Pre-commit em TypeScript OOP

O pre-commit hook foi reescrito de shell script para **TypeScript OOP** no diretório `src/pre-commit/`. A estrutura inclui:

- `Check` — classe base abstrata para cada check
- `checks/` — implementações concretas dos 7 checks
- `reporters/` — formatação de output (cores, ícones, tempos de execução)
- `index.ts` — orquestrador que executa todos os checks em sequência
