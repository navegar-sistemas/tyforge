---
title: Linter
sidebar_position: 5
---

# Linter (`tyforge-lint`)

O TyForge inclui um linter de padrões que verifica código TypeScript contra as convenções do projeto. A maioria das regras opera por análise de texto linha-a-linha, garantindo execução rápida. Regras que exigem análise semântica mais profunda utilizam a infraestrutura AST baseada na TypeScript Compiler API.

## Arquitetura

O linter é composto por componentes principais divididos em duas camadas: análise textual e análise AST.

### RuleRegistry

Gerencia o registro e ativação de regras. Cada regra pode ter sua severidade sobrescrita via configuração (`"error"`, `"warning"`, `"off"`). Regras desligadas (`"off"`) são removidas do pipeline de verificação.

```typescript
const registry = new RuleRegistry();
registry.registerAll(RuleRegistry.createDefault());
registry.applyConfig({ "no-any": "error", "no-cast": "warning" });
```

Métodos estáticos utilitários:
- `RuleRegistry.createDefault()` — retorna array com as 12 regras padrão instanciadas (10 textuais + 2 AST)
- `RuleRegistry.getDefaultRuleNames()` — retorna nomes das regras padrão
- `RuleRegistry.getDefaultRuleCount()` — retorna quantidade de regras padrão

### DisableCommentParser

Analisa comentários de desativação no código-fonte. Suporta duas diretivas:

- `tyforge-lint-disable-next-line [regras]` — desativa regras na próxima linha
- `tyforge-lint-disable-line [regras]` — desativa regras na mesma linha

Se nenhuma regra for especificada, todas são desativadas para aquela linha.

**Nota:** o uso de diretivas de desativação é proibido pelas convenções do projeto. Se o linter acusar uma violação, corrija o código.

### Linter

Classe principal que executa a verificação. Para cada arquivo:

1. Lê o conteúdo e divide em linhas
2. Analisa comentários de desativação via `DisableCommentParser`
3. Executa cada regra ativa em cada linha
4. No modo `--fix`, aplica correções automáticas das regras fixáveis
5. Coleta e retorna todas as violações

### IReporter / TextReporter / JsonReporter

Interface e implementações de saída:

| Reporter | Descrição |
|----------|-----------|
| `TextReporter` | Saída legível para terminal com cores e agrupamento por arquivo |
| `JsonReporter` | Saída JSON para integração com CI/CD |

### Rule (classe base — regras textuais)

Cada regra textual estende a classe abstrata `Rule`:

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

Métodos utilitários disponibilizados pela classe base:

- `isTestFile(filePath)` — identifica arquivos de teste (`__tests__`, `.test.ts`, `.spec.ts`)
- `stripLiterals(line)` — remove strings literais, template literals e regex da linha para evitar falsos positivos
- `violation(line, filePath, message?)` — cria um `IRuleViolation` com os dados da regra

### AstRule e AstAnalyzer (infraestrutura AST)

Regras que exigem análise semântica (ex: verificar hierarquia de classes, assinaturas de métodos, visibilidade de construtores) estendem `AstRule` em vez de `Rule`. O `AstAnalyzer` utiliza a TypeScript Compiler API para parsear o código-fonte e construir a árvore sintática, permitindo inspeção de nós como `ClassDeclaration`, `ConstructorDeclaration` e `MethodDeclaration`.

```typescript
abstract class AstRule {
  constructor(
    readonly name: string,
    readonly description: string,
    readonly severity: "error" | "warning",
  ) {}

  abstract analyze(sourceFile: ts.SourceFile, filePath: string): IRuleViolation[];
}
```

O `AstAnalyzer` coordena a execução das `AstRule` registradas, parseando cada arquivo uma única vez e distribuindo o `SourceFile` para todas as regras AST ativas.

## Regras disponíveis

| Regra | Severidade padrão | Fixável | Descrição |
|-------|-------------------|---------|-----------|
| `no-any` | error | Não | Proíbe uso de `any` em código de produção |
| `no-cast` | error | Não | Proíbe `as` para cast e angle bracket assertion (exceto `as const`) |
| `no-non-null` | error | Não | Proíbe `!` (non-null assertion) |
| `no-ts-ignore` | error | Não | Proíbe `@ts-ignore` e `@ts-expect-error` |
| `no-export-default` | error | Sim | Proíbe `export default` — usar named exports |
| `no-to-json-lowercase` | error | Sim | Proíbe `toJson()` — usar `toJSON()` (capital JSON) |
| `no-new-type-field` | error | Não | Proíbe instanciar TypeFields com `new` — usar `create()` ou `createOrThrow()` |
| `no-magic-http-status` | warning | Não | Proíbe números mágicos de HTTP status — usar `OHttpStatus` |
| `no-declare` | error | Não | Proíbe `declare` em classes — usar `readonly` + constructor |
| `no-satisfies-without-prefix` | error | Não | Proíbe `satisfies` sem prefixo `I` — usar `satisfies ISchema`, não `satisfies Schema` |
| `no-invalid-factory-signature` | error | Não | Valida assinaturas `create(raw, fieldPath)` e `assign(raw, fieldPath)` em descendentes de `ClassDomainModels` e `TypeField` (regra AST) |
| `no-public-constructor-domain` | error | Não | Valida que construtores de domain models são `private` ou `protected`, e que `new` só ocorre dentro de `create`/`assign` (regra AST) |

Regras com severidade `error` no modo `strict` (padrão) causam falha no exit code. No modo não-strict, apenas regras com severidade `error` causam falha — warnings são reportados mas não impedem o sucesso.

As duas últimas regras (`no-invalid-factory-signature` e `no-public-constructor-domain`) utilizam a infraestrutura AST descrita acima, analisando a árvore sintática do TypeScript em vez de texto linha-a-linha.

## Comandos CLI

### Verificação padrão (todos os arquivos)

```bash
npx tyforge-lint --all
```

Busca todos os arquivos `.ts` no diretório raiz configurado (padrão: `src`).

### Verificação de arquivos staged

```bash
npx tyforge-lint --staged
```

Verifica apenas arquivos `.ts` que estão no staging area do Git (Added, Copied, Modified).

### Auto-correção

```bash
npx tyforge-lint --fix
```

Aplica correções automáticas nas regras fixáveis (`no-export-default`, `no-to-json-lowercase`). Violações não fixáveis continuam sendo reportadas.

### Saída JSON

```bash
npx tyforge-lint --format json
```

Gera saída em formato JSON, ideal para integração com CI/CD e ferramentas de análise.

### Diretório customizado

```bash
npx tyforge-lint --cwd ./packages/api
```

Altera o diretório de trabalho antes de executar o linter.

### Caminhos específicos

```bash
npx tyforge-lint src/tools src/lint/rules/no-any.rule.ts
```

Verifica apenas os caminhos especificados. Diretórios são processados recursivamente.

### Inicialização

```bash
npx tyforge-lint --init
```

Cria o arquivo de configuração `tyforge-lint.config.json` com valores padrão e configura hook de pre-commit.

### Atualização

```bash
npx tyforge-lint --init --update
```

Atualiza a configuração e hooks existentes para a versão mais recente.

### Desinstalação

```bash
npx tyforge-lint --uninstall
```

Remove hooks e configuração do linter.

## Configuração

### Arquivo dedicado (`tyforge-lint.config.json`)

```json
{
  "lint": {
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
      "no-satisfies-without-prefix": "error",
      "no-invalid-factory-signature": "error",
      "no-public-constructor-domain": "error"
    }
  }
}
```

### Seção no arquivo unificado (`tyforge.config.json`)

```json
{
  "schema": { "..." : "..." },
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

### Parâmetros de configuração

| Parâmetro | Tipo | Padrão | Descrição |
|-----------|------|--------|-----------|
| `root` | `string` | `"src"` | Diretório raiz para busca de arquivos |
| `strict` | `boolean` | `true` | Se `true`, warnings também causam falha no exit code |
| `exclude` | `string[]` | `[]` | Padrões glob para excluir arquivos da verificação |
| `rules` | `Record<string, severity>` | — | Sobrescrita de severidade por regra (`"error"`, `"warning"`, `"off"`) |

### Prioridade de configuração

1. Flag `--config <path>` — arquivo especificado na linha de comando
2. `tyforge-lint.config.json` — arquivo dedicado na raiz do projeto
3. Seção `lint` de `tyforge.config.json` — configuração unificada
4. Valores padrão — se nenhuma configuração for encontrada

### Severidades

| Valor | Descrição |
|-------|-----------|
| `"error"` | Violação grave — sempre causa falha no exit code |
| `"warning"` | Aviso — causa falha apenas no modo strict |
| `"off"` | Regra desativada — não é verificada |

## Gerenciadores de hooks

O comando `--init` detecta automaticamente o gerenciador de hooks do projeto:

| Gerenciador | Detecção |
|-------------|----------|
| **Husky** | Diretório `.husky/` presente |
| **Lefthook** | Arquivo `lefthook.yml` presente |
| **Nativo** | Nenhum gerenciador detectado — usa `.git/hooks/pre-commit` |

## Integração com CI

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

O linter retorna exit code `0` em sucesso e `1` se houver violações que configuram falha (conforme modo strict/não-strict).
