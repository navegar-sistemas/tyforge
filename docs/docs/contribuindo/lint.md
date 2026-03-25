---
title: Linter
sidebar_position: 5
---

# Linter (`tyforge-lint`)

O TyForge inclui um linter de padroes que verifica codigo TypeScript contra as convencoes do projeto. Ele opera por analise de texto linha-a-linha — nao depende de AST nem do compilador TypeScript — garantindo execucao rapida mesmo em projetos grandes.

## Arquitetura

O linter e composto por cinco componentes principais:

### RuleRegistry

Gerencia o registro e ativacao de regras. Cada regra pode ter sua severidade sobrescrita via configuracao (`"error"`, `"warning"`, `"off"`). Regras desligadas (`"off"`) sao removidas do pipeline de verificacao.

```typescript
const registry = new RuleRegistry();
registry.registerAll([new NoAnyRule(), new NoCastRule()]);
registry.applyConfig({ "no-any": "error", "no-cast": "warning" });
```

### DisableCommentParser

Analisa comentarios de desativacao no codigo-fonte. Suporta duas diretivas:

- `tyforge-lint-disable-next-line [regras]` — desativa regras na proxima linha
- `tyforge-lint-disable-line [regras]` — desativa regras na mesma linha

Se nenhuma regra for especificada, todas sao desativadas para aquela linha.

**Nota:** o uso de diretivas de desativacao e proibido pelas convencoes do projeto. Se o linter acusar uma violacao, corrija o codigo.

### Linter

Classe principal que executa a verificacao. Para cada arquivo:

1. Le o conteudo e divide em linhas
2. Analisa comentarios de desativacao via `DisableCommentParser`
3. Executa cada regra ativa em cada linha
4. No modo `--fix`, aplica correcoes automaticas das regras fixaveis
5. Coleta e retorna todas as violacoes

### IReporter / TextReporter / JsonReporter

Interface e implementacoes de saida:

| Reporter | Descricao |
|----------|-----------|
| `TextReporter` | Saida legivel para terminal com cores e agrupamento por arquivo |
| `JsonReporter` | Saida JSON para integracao com CI/CD |

### Rule (classe base)

Cada regra estende a classe abstrata `Rule`:

```typescript
abstract class Rule {
  constructor(
    readonly name: string,
    readonly description: string,
    readonly severity: "error" | "warning",
    readonly fixable: boolean,
  ) {}

  abstract check(line: string, lineNumber: number, filePath: string): IRuleViolation | null;
  fix?(line: string): string;
}
```

Metodos utilitarios disponibilizados pela classe base:

- `isTestFile(filePath)` — identifica arquivos de teste (`__tests__`, `.test.ts`, `.spec.ts`)
- `stripLiterals(line)` — remove strings literais, template literals e regex da linha para evitar falsos positivos
- `violation(line, filePath, message?)` — cria um `IRuleViolation` com os dados da regra

## Regras disponiveis

| Regra | Severidade padrao | Fixavel | Descricao |
|-------|-------------------|---------|-----------|
| `no-any` | error | Nao | Proibe uso de `any` em codigo de producao |
| `no-cast` | error | Nao | Proibe `as` para cast e angle bracket assertion (exceto `as const`) |
| `no-non-null` | error | Nao | Proibe `!` (non-null assertion) |
| `no-ts-ignore` | error | Nao | Proibe `@ts-ignore` e `@ts-expect-error` |
| `no-export-default` | error | Sim | Proibe `export default` — usar named exports |
| `no-to-json-lowercase` | error | Sim | Proibe `toJson()` — usar `toJSON()` (capital JSON) |
| `no-new-type-field` | error | Nao | Proibe instanciar TypeFields com `new` — usar `create()` ou `createOrThrow()` |
| `no-magic-http-status` | warning | Nao | Proibe numeros magicos de HTTP status — usar `OHttpStatus` |
| `no-declare` | error | Nao | Proibe `declare` em classes — usar `readonly` + constructor |
| `no-satisfies-without-prefix` | error | Nao | Proibe `satisfies` sem prefixo `I` — usar `satisfies ISchema`, nao `satisfies Schema` |

Regras com severidade `error` no modo `strict` (padrao) causam falha no exit code. No modo nao-strict, apenas regras com severidade `error` causam falha — warnings sao reportados mas nao impedem o sucesso.

## Comandos CLI

### Verificacao padrao (todos os arquivos)

```bash
npx tyforge-lint --all
```

Busca todos os arquivos `.ts` no diretorio raiz configurado (padrao: `src`).

### Verificacao de arquivos staged

```bash
npx tyforge-lint --staged
```

Verifica apenas arquivos `.ts` que estao no staging area do Git (Added, Copied, Modified).

### Auto-correcao

```bash
npx tyforge-lint --fix
```

Aplica correcoes automaticas nas regras fixaveis (`no-export-default`, `no-to-json-lowercase`). Violacoes nao fixaveis continuam sendo reportadas.

### Saida JSON

```bash
npx tyforge-lint --format json
```

Gera saida em formato JSON, ideal para integracao com CI/CD e ferramentas de analise.

### Diretorio customizado

```bash
npx tyforge-lint --cwd ./packages/api
```

Altera o diretorio de trabalho antes de executar o linter.

### Caminhos especificos

```bash
npx tyforge-lint src/tools src/lint/rules/no-any.rule.ts
```

Verifica apenas os caminhos especificados. Diretorios sao processados recursivamente.

### Inicializacao

```bash
npx tyforge-lint --init
```

Cria o arquivo de configuracao `tyforge-lint.config.json` com valores padrao e configura hook de pre-commit.

### Atualizacao

```bash
npx tyforge-lint --init --update
```

Atualiza a configuracao e hooks existentes para a versao mais recente.

### Desinstalacao

```bash
npx tyforge-lint --uninstall
```

Remove hooks e configuracao do linter.

## Configuracao

### Arquivo dedicado (`tyforge-lint.config.json`)

```json
{
  "root": "src",
  "strict": true,
  "exclude": ["**/__tests__/**", "**/benchmark/**"],
  "rules": {
    "no-any": "error",
    "no-cast": "error",
    "no-non-null": "error",
    "no-ts-ignore": "error",
    "no-export-default": "error",
    "no-to-json-lowercase": "error",
    "no-new-type-field": "error",
    "no-magic-http-status": "warning",
    "no-declare": "error",
    "no-satisfies-without-prefix": "error"
  }
}
```

### Secao no arquivo unificado (`tyforge.config.json`)

```json
{
  "schema": { ... },
  "lint": {
    "root": "src",
    "strict": true,
    "rules": {
      "no-any": "error",
      "no-magic-http-status": "warning"
    }
  }
}
```

### Parametros de configuracao

| Parametro | Tipo | Padrao | Descricao |
|-----------|------|--------|-----------|
| `root` | `string` | `"src"` | Diretorio raiz para busca de arquivos |
| `strict` | `boolean` | `true` | Se `true`, warnings tambem causam falha no exit code |
| `exclude` | `string[]` | `[]` | Padroes glob para excluir arquivos da verificacao |
| `rules` | `Record<string, severity>` | — | Sobrescrita de severidade por regra (`"error"`, `"warning"`, `"off"`) |

### Prioridade de configuracao

1. Flag `--config <path>` — arquivo especificado na linha de comando
2. `tyforge-lint.config.json` — arquivo dedicado na raiz do projeto
3. Secao `lint` de `tyforge.config.json` — configuracao unificada
4. Valores padrao — se nenhuma configuracao for encontrada

### Severidades

| Valor | Descricao |
|-------|-----------|
| `"error"` | Violacao grave — sempre causa falha no exit code |
| `"warning"` | Aviso — causa falha apenas no modo strict |
| `"off"` | Regra desativada — nao e verificada |

## Gerenciadores de hooks

O comando `--init` detecta automaticamente o gerenciador de hooks do projeto:

| Gerenciador | Deteccao |
|-------------|----------|
| **Husky** | Diretorio `.husky/` presente |
| **Lefthook** | Arquivo `lefthook.yml` presente |
| **Nativo** | Nenhum gerenciador detectado — usa `.git/hooks/pre-commit` |

## Integracao com CI

```yaml
# GitHub Actions
- name: Lint TypeScript patterns
  run: npx tyforge-lint --all --format json
```

```yaml
# GitLab CI
lint:
  script:
    - npx tyforge-lint --all
```

O linter retorna exit code `0` em sucesso e `1` se houver violacoes que configuram falha (conforme modo strict/nao-strict).
