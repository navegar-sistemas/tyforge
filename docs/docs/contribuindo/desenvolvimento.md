---
title: Desenvolvimento
sidebar_position: 3
---

# Desenvolvimento

## Pre-requisitos

- Node.js v18.0.0+
- npm v9.0.0+

## Setup

```bash
git clone https://github.com/navegar-sistemas/tyforge.git
cd tyforge
npm install
```

## Comandos

```bash
npm run build          # tsc && tsc-alias — compila TypeScript e resolve path aliases
npm run typecheck      # tsc --noEmit — verificacao de tipos sem emitir arquivos
```

## Path Aliases

O projeto usa `@tyforge/*` como alias para `src/*`, configurado no `tsconfig.json`:

```json
{
  "paths": {
    "@tyforge/*": ["src/*"]
  }
}
```

O `tsc-alias` resolve esses aliases no build para caminhos relativos no output `dist/`.

## Estrutura do Source

```
src/
├── result/            — Result<T, E>
├── exceptions/        — 18 tipos RFC 7807
├── type-fields/       — TypeField<TPrimitive, TFormatted>
├── schema/            — SchemaBuilder.compile()
├── domain-models/     — Entity, ValueObject, Aggregate, Dto, DomainEvent
├── tools/             — TypeGuard, ToolParse, ToolFormattingDateISO8601
├── constants/         — OHttpStatus, THttpStatus
└── index.ts           — API publica
```

## Output

- **Formato**: CommonJS
- **Target**: ES2022
- **Saida**: `dist/`
- **Declaracoes**: `.d.ts` com declaration maps
- **Source maps**: habilitados

## Dependencias

| Pacote | Tipo | Uso |
|--------|------|-----|
| `uuid` | runtime | `FId.generate()` e `DomainEvent` |
| `typescript` | dev | compilador |
| `tsc-alias` | dev | resolve path aliases no build |
| `zod` | dev | benchmarks comparativos |
