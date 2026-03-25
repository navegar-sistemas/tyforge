---
title: Visao Geral
sidebar_position: 1
---

# Tools

O TyForge fornece um conjunto de utilitarios genericos reutilizaveis em toda a biblioteca e projetos consumidores. Cada ferramenta resolve um problema especifico sem depender de dominio ou framework.

## Ferramentas disponiveis

### TypeGuard

Classe estatica para verificacao e narrowing de tipos em tempo de execucao. Todos os metodos retornam `Result<T, ExceptionValidation>` ou type guards nativos do TypeScript.

**Regra fundamental:** nunca use `typeof` manualmente no projeto. Toda verificacao de tipo primitivo deve passar pelo `TypeGuard`.

```typescript
import { TypeGuard } from "tyforge";

const result = TypeGuard.isString(value, "fieldName", 1, 255);
if (result.success) {
  // result.value e a string ja com trim
}
```

[Documentacao completa do TypeGuard](/guia/tools/type-guard)

### ToolObjectTransform

Utilitario para achatar e desachatar objetos aninhados. Usado internamente pela configuracao (`loadTyForgeConfig`) e pelo linter para validar configs com chaves compostas como `schema.validate.create`.

```typescript
import { ToolObjectTransform } from "tyforge";

const obj = { schema: { validate: { create: "full" } } };
const flat = ToolObjectTransform.flatten(obj);
// Map { "schema.validate.create" => "full" }

const restored = ToolObjectTransform.unflatten(flat);
// { schema: { validate: { create: "full" } } }
```

**Metodos:**

| Metodo | Assinatura | Descricao |
|--------|-----------|-----------|
| `flatten` | `(obj, prefix?) => Map<string, unknown>` | Achata objeto aninhado em um `Map` com chaves compostas por `.` |
| `unflatten` | `(flat) => Record<string, unknown>` | Reconstroi objeto aninhado a partir de um `Map` achatado |

O `unflatten` possui protecao contra chaves perigosas (`__proto__`, `constructor`, `prototype`), ignorando-as silenciosamente.

### ToolCliParser

Parser leve de argumentos de linha de comando. Nao depende de bibliotecas externas.

```typescript
import { ToolCliParser } from "tyforge";

const cli = new ToolCliParser(process.argv.slice(2));

cli.hasFlag("--fix");              // boolean
cli.getFlagValue("--format");      // string | undefined
cli.getPositionalArgs();           // string[]
```

**Metodos:**

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `hasFlag(name)` | `boolean` | Verifica se a flag existe nos argumentos |
| `getFlagValue(name)` | `string \| undefined` | Retorna o valor do proximo argumento apos a flag |
| `getPositionalArgs()` | `string[]` | Retorna argumentos que nao sao flags nem valores de flags |

### ToolFileDiscovery

Descoberta recursiva de arquivos por extensao ou caminhos especificos. Ignora `node_modules` e `.git` automaticamente.

```typescript
import { ToolFileDiscovery } from "tyforge";

const discovery = new ToolFileDiscovery("src", ["**/__tests__/**"]);

const allTs = discovery.findByExtension(".ts");
const specific = discovery.findByPaths(["src/tools", "src/lint"], ".ts");
```

**Metodos:**

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `findByExtension(ext)` | `string[]` | Busca recursiva por extensao no diretorio raiz |
| `findByPaths(paths, ext)` | `string[]` | Busca em caminhos especificos (arquivos ou diretorios) |

O construtor aceita um array de padroes glob para exclusao (ex: `["**/node_modules/**"]`).

### ToolGit

Utilitario para operacoes Git simples, usado pelo linter no modo `--staged`.

```typescript
import { ToolGit } from "tyforge";

const staged = ToolGit.getStagedFiles(".ts");
// Retorna array de caminhos de arquivos .ts staged no git
```

**Metodos:**

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `getStagedFiles(ext?)` | `string[]` | Lista arquivos staged (Added, Copied, Modified) filtrados por extensao |

Usa `git diff --cached --name-only --diff-filter=ACM` internamente. Retorna array vazio se o comando falhar (ex: diretorio nao e um repositorio git).

## Proximos passos

- [TypeGuard](/guia/tools/type-guard) — referencia completa de todos os metodos de verificacao de tipo
