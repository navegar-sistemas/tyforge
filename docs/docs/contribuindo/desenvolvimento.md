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
| `npm run build` | `tsc && tsc-alias` — compila TypeScript e resolve path aliases |
| `npm run typecheck` | `tsc --noEmit` — verificação de tipos sem emitir arquivos |
| `npm run test` | `tsx --test src/**/*.test.ts` — executa todos os testes |
| `npx tyforge-lint` | Linter de padrões do TyForge |
| `npx tyforge-lint --fix` | Auto-correção de violações do linter |

## Documentação local

### Docusaurus (porta 3000)

```bash
cd docs && npm install && npm run start
```

### Docker (porta 4200)

```bash
cd docs && docker compose up
```

## Pre-commit hooks

O projeto usa Husky para executar verificações automáticas antes de cada commit. Os hooks são instalados automaticamente via `npm install` (script `"prepare": "husky"`).

Os 5 checks executados no pre-commit:

1. **typecheck** — `npm run typecheck`
2. **tests** — `npm run test`
3. **tyforge-lint** — `npx tyforge-lint`
4. **docs build local** — build da documentação Docusaurus
5. **docs Docker build** — build da documentação via Docker

## Estrutura do source

```
src/
├── result/          — Result<T, E>
├── exceptions/      — 18 tipos RFC 7807
├── type-fields/     — TypeField<TPrimitive, TFormatted> e 50+ implementações
├── schema/          — SchemaBuilder.compile(), batch processing
├── domain-models/   — Entity, ValueObject, Aggregate, Dto, DomainEvent
├── application/     — UseCase, IMapper, CQRS
├── infrastructure/  — IRepositoryBase, Paginated, IUnitOfWork
├── tools/           — TypeGuard, ToolObjectTransform, ToolCliParser, ToolFileDiscovery, ToolGit
├── config/          — loadTyForgeConfig(), ITyForgeConfig
├── lint/            — tyforge-lint CLI e regras
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

O `tsc-alias` resolve esses aliases no build para caminhos relativos no output `dist/`.

## Output

- **Formato**: CommonJS
- **Target**: ES2022
- **Saída**: `dist/`
- **Declarações**: `.d.ts` com declaration maps
- **Source maps**: habilitados

## Dependências

| Pacote | Tipo | Uso |
|--------|------|-----|
| `uuid` | runtime | `FId.generate()` e `DomainEvent` |
| `typescript` | dev | Compilador TypeScript |
| `tsc-alias` | dev | Resolve path aliases no build |
| `tsx` | dev | Execução de testes TypeScript |
| `zod` | dev | Benchmarks comparativos |
| `husky` | dev | Pre-commit hooks |
