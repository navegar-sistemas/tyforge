---
title: Pre-commit
sidebar_position: 9
---

# Pre-commit

O sistema de pre-commit do TyForge é uma aplicação TypeScript orientada a objetos em `src/pre-commit/`. Substitui o antigo shell script por uma arquitetura extensível com classes tipadas, reporters e severidade configurável.

O hook do Husky (`.husky/pre-commit`) invoca diretamente:

```bash
npx tsx src/pre-commit/index.ts
```

## Arquitetura

```
src/pre-commit/
  index.ts                     # Orquestrador principal
  check.base.ts                # Classe base abstrata
  reporters/
    terminal.ts                # Reporter para terminal
  checks/
    typecheck.ts               # CheckTypecheck
    tests.ts                   # CheckTests
    lint.ts                    # CheckLint
    docs-build.ts              # CheckDocsBuild
    docker-build.ts            # CheckDockerBuild
    deprecated-check.ts        # CheckDeprecated
    version-check.ts           # CheckVersions
```

O `index.ts` instancia todos os checks, separa em `blockingChecks` e `confirmableChecks`, e executa sequencialmente. Checks blocking são executados primeiro — qualquer falha interrompe o commit imediatamente com `process.exit(1)`. Checks confirmable vêm depois e exibem warnings que requerem confirmação do usuário.

## Classe base `Check`

Toda verificação estende a classe abstrata `Check` definida em `check.base.ts`:

```typescript
export abstract class Check {
  constructor(
    readonly name: string,
    readonly severity: TCheckSeverity, // "blocking" | "confirmable"
  ) {}

  abstract run(): Promise<ICheckResult>;
}
```

### Severidade

| Severidade | Comportamento |
|------------|---------------|
| `"blocking"` | Falha impede o commit — sem possibilidade de override |
| `"confirmable"` | Warning exibido ao usuário — commit prossegue apenas com confirmação explícita |

### Métodos auxiliares

A classe base fornece métodos compartilhados para todos os checks:

| Método | Descrição |
|--------|-----------|
| `pass(details?)` | Retorna resultado de sucesso |
| `warn(details)` | Retorna resultado de warning |
| `fail(details)` | Retorna resultado de falha |
| `extractError(e, options?)` | Extrai mensagens de erro de `execFileSync`, com controle de stream (`stdout`/`stderr`/`both`), filtro por linha e limite de linhas |
| `findFiles(patterns, excludes?)` | Busca arquivos por nome usando `find` com `execFileSync` |
| `findPackageJsonFiles()` | Atalho para buscar todos os `package.json` |
| `findDockerfiles()` | Atalho para buscar todos os `Dockerfile` e `Dockerfile.*` |
| `isDockerAvailable()` | Verifica se o Docker está acessível via `docker info` |

## Checks blocking

Checks blocking impedem o commit em caso de falha. Não há opção de prosseguir.

### CheckTypecheck

Executa `npm run typecheck` (que roda `tsc --noEmit`) com timeout de 120 segundos. Qualquer erro de tipo impede o commit.

```typescript
execFileSync("npm", ["run", "typecheck"], {
  stdio: "pipe", encoding: "utf-8", timeout: 120000,
});
```

### CheckTests

Executa `npm run test` com timeout de 120 segundos. Filtra linhas de erro contendo marcadores de falha para exibir um resumo conciso.

```typescript
execFileSync("npm", ["run", "test"], {
  stdio: "pipe", encoding: "utf-8", timeout: 120000,
});
```

### CheckLint

Executa o linter do TyForge com `npx tsx src/lint/index.ts --all` e timeout de 60 segundos. Qualquer violação (erro ou warning) impede o commit.

```typescript
execFileSync("npx", ["tsx", "src/lint/index.ts", "--all"], {
  stdio: "pipe", encoding: "utf-8", timeout: 60000,
});
```

### CheckDocsBuild

Executa `npm run build` no diretório `docs/` com timeout de 120 segundos. Verifica que a documentação compila sem erros.

```typescript
execFileSync("npm", ["run", "build"], {
  cwd: "docs", stdio: "pipe", encoding: "utf-8", timeout: 120000,
});
```

### CheckDockerBuild

Executa `docker build` do Dockerfile da documentação com timeout de 300 segundos (5 minutos). Se o Docker não estiver disponível, retorna warning em vez de falha.

```typescript
if (!this.isDockerAvailable()) {
  return this.warn(["Docker not available — skipping Docker build check"]);
}
execFileSync("docker", ["build", "-f", "docs/Dockerfile", "docs/", "--quiet"], {
  stdio: "pipe", encoding: "utf-8", timeout: 300000,
});
```

### CheckDeprecated

Verifica se alguma dependência do projeto está marcada como deprecated no registro npm. Percorre todos os `package.json` encontrados no repositório e consulta cada pacote via `npm view`.

Características:
- Usa `execFileSync` com `npm view <pkg> deprecated --json` para cada pacote
- Deduplicação por `Set` — cada pacote é verificado apenas uma vez, mesmo que apareça em múltiplos `package.json`
- Coleta dependências de todas as seções: `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies`
- Timeout de 10 segundos por consulta individual
- Pacotes privados ou não publicados são silenciosamente ignorados

```typescript
const info = execFileSync("npm", ["view", name, "deprecated", "--json"], {
  stdio: "pipe", encoding: "utf-8", timeout: 10000,
}).trim();
```

## Checks confirmable

Checks confirmable exibem warnings e requerem confirmação explícita do usuário para prosseguir.

### CheckVersions

Verificação abrangente de versões e segurança. Agrupa os resultados em categorias:

#### Pinned versions

Identifica dependências com ranges (`^`, `~`, `>=`, `<`, `*`) em vez de versões pinadas. Exibe tabela com pacote, versão atual e versão sugerida (sem range).

#### npm outdated

Executa `npm outdated --json` em cada diretório com `node_modules`. Exibe tabela com pacote, versão atual e última versão disponível.

#### npm audit

Executa `npm audit --json` e faz cross-reference das vulnerabilidades. Filtra por severidade (critical, high, moderate) e exibe informações de fix quando disponíveis.

#### Node engine

Compara a versão do Node.js em execução com o campo `engines.node` do `package.json` raiz.

#### Docker images

Consulta a API do Docker Hub para verificar se as imagens referenciadas nos Dockerfiles estão na versão mais recente dentro do mesmo major/minor. Compara tags semver e reporta quando uma versão mais nova está disponível.

#### CSP workaround status

Verifica se o Docusaurus ainda gera inline scripts. Se não houver mais inline scripts, sugere que o workaround `generate-csp.js` pode ser removido.

## Terminal reporter

O `TerminalReporter` (`src/pre-commit/reporters/terminal.ts`) formata a saída para o terminal:

- Exibe progresso no formato `[N/total] check-name...`
- Para checks blocking que falham: saída em `stderr` com detalhes
- Para checks confirmable com warnings: exibe painel formatado e solicita confirmação via prompt

### Segurança em non-TTY

Se o terminal não for interativo (`!process.stdin.isTTY`), o reporter **bloqueia o commit automaticamente** — não auto-aprova warnings. Isso garante que pipelines CI e editores que executam hooks não aprovem silenciosamente verificações que requerem atenção humana.

```typescript
if (!process.stdin.isTTY) {
  process.stdout.write("  ❌ Non-interactive terminal — cannot confirm. Commit blocked.\n");
  return false;
}
```

## Segurança

Todos os checks seguem práticas de segurança rigorosas:

- **Zero shell injection** — todos os comandos usam `execFileSync` com array de argumentos separados. Nenhum check usa `execSync` com interpolação de strings
- **Timeouts em todos os comandos** — cada `execFileSync` tem timeout explícito, evitando que um processo travado bloqueie o commit indefinidamente
- **Isolamento de erros** — falhas em um check não afetam os demais. Cada check captura suas próprias exceções

| Check | Timeout |
|-------|---------|
| `CheckTypecheck` | 120s |
| `CheckTests` | 120s |
| `CheckLint` | 60s |
| `CheckDocsBuild` | 120s |
| `CheckDockerBuild` | 300s |
| `CheckDeprecated` | 10s por pacote |
| `CheckVersions` (npm) | 30s por comando |
| `CheckVersions` (Docker Hub) | 20s por imagem |

## Como adicionar um check

1. Crie um arquivo em `src/pre-commit/checks/` (ex: `my-check.ts`)
2. Estenda a classe `Check` com a severidade apropriada:

```typescript
import { execFileSync } from "node:child_process";
import { Check } from "../check.base";

export class CheckMyCheck extends Check {
  constructor() {
    super("my check", "blocking"); // or "confirmable"
  }

  async run() {
    try {
      execFileSync("npm", ["run", "my-command"], {
        stdio: "pipe",
        encoding: "utf-8",
        timeout: 60000,
      });
      return this.pass();
    } catch (e) {
      return this.fail(this.extractError(e));
    }
  }
}
```

3. Registre o check em `src/pre-commit/index.ts`:

```typescript
import { CheckMyCheck } from "./checks/my-check";

// Add to the appropriate array:
const blockingChecks: Check[] = [
  // ... existing checks
  new CheckMyCheck(),
];
```

4. Execute `npm run typecheck` para verificar que o código compila sem erros.
