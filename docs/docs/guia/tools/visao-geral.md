---
title: Visão Geral
sidebar_position: 1
---

# Tools

O TyForge fornece um conjunto de utilitários genéricos reutilizáveis em todo o framework e projetos consumidores. Cada ferramenta resolve um problema específico sem depender de domínio ou framework.

## Ferramentas disponíveis

### TypeGuard

Classe estática para verificação e narrowing de tipos em tempo de execução. Todos os métodos retornam `Result<T, ExceptionValidation>` ou type guards nativos do TypeScript.

**Regra fundamental:** nunca use `typeof` manualmente no projeto. Toda verificação de tipo primitivo deve passar pelo `TypeGuard`.

```typescript
import { TypeGuard } from "tyforge";

const result = TypeGuard.isString(value, "fieldName", 1, 255);
if (result.success) {
  // result.value é a string já com trim
}
```

[Documentação completa do TypeGuard](/guia/tools/type-guard)

### ToolObjectTransform

Utilitário para achatar e desachatar objetos aninhados. Usado internamente pela configuração (async `loadTyForgeConfig`) e pelo linter para validar configs com chaves compostas como `schema.validate.create`.

```typescript
import { ToolObjectTransform } from "tyforge";

const obj = { schema: { validate: { create: "full" } } };
const flat = ToolObjectTransform.flatten(obj);
// Map { "schema.validate.create" => "full" }

const restored = ToolObjectTransform.unflatten(flat);
// { schema: { validate: { create: "full" } } }
```

**Métodos:**

| Método | Assinatura | Descrição |
|--------|-----------|-----------|
| `flatten` | `(obj, prefix?) => Map<string, unknown>` | Achata objeto aninhado em um `Map` com chaves compostas por `.` |
| `unflatten` | `(flat) => Record<string, unknown>` | Reconstrói objeto aninhado a partir de um `Map` achatado |

O `unflatten` possui proteção contra chaves perigosas (`__proto__`, `constructor`, `prototype`), ignorando-as silenciosamente.

### ToolCliParser

Parser leve de argumentos de linha de comando. Não depende de bibliotecas externas.

```typescript
import { ToolCliParser } from "tyforge";

const cli = new ToolCliParser(process.argv.slice(2));

cli.hasFlag("--fix");              // boolean
cli.getFlagValue("--format");      // string | undefined
cli.getPositionalArgs();           // string[]
```

**Métodos:**

| Método | Retorno | Descrição |
|--------|---------|-----------|
| `hasFlag(name)` | `boolean` | Verifica se a flag existe nos argumentos |
| `getFlagValue(name)` | `string \| undefined` | Retorna o valor do próximo argumento após a flag |
| `getPositionalArgs()` | `string[]` | Retorna argumentos que não são flags nem valores de flags |

### ToolFileDiscovery

Descoberta recursiva de arquivos por extensão ou caminhos específicos. Ignora `node_modules` e `.git` automaticamente.

```typescript
import { ToolFileDiscovery } from "tyforge";

const discovery = new ToolFileDiscovery("src", ["**/__tests__/**"]);

const allTs = discovery.findByExtension(".ts");
const specific = discovery.findByPaths(["src/tools", "src/lint"], ".ts");
```

**Métodos:**

| Método | Retorno | Descrição |
|--------|---------|-----------|
| `findByExtension(ext)` | `string[]` | Busca recursiva por extensão no diretório raiz |
| `findByPaths(paths, ext)` | `string[]` | Busca em caminhos específicos (arquivos ou diretórios) |

O construtor aceita um array de padrões glob para exclusão (ex: `["**/node_modules/**"]`).

### ToolGit

Utilitário para operações Git simples, usado pelo linter no modo `--staged`.

```typescript
import { ToolGit } from "tyforge";

const staged = ToolGit.getStagedFiles(".ts");
// Retorna array de caminhos de arquivos .ts staged no git
```

**Métodos:**

| Método | Retorno | Descrição |
|--------|---------|-----------|
| `getStagedFiles(ext?)` | `string[]` | Lista arquivos staged (Added, Copied, Modified) filtrados por extensão |

Usa `git diff --cached --name-only --diff-filter=ACM` internamente. Retorna array vazio se o comando falhar (ex: diretório não é um repositório git).

### ToolHeaderSecurity

Sanitização de headers HTTP contra CRLF injection e prototype pollution.

```typescript
import { ToolHeaderSecurity } from "tyforge";

const sanitized = ToolHeaderSecurity.sanitizeHeaders({
  "Authorization": "Bearer token",
  "X-Custom\r\nInjected": "value",
});
// Remove caracteres CRLF e null bytes dos headers
// Rejeita keys __proto__, constructor, prototype
```

### ToolNetworkSecurity

Resolução DNS e validação contra ranges de IP privados para prevenção de SSRF.

```typescript
import { ToolNetworkSecurity } from "tyforge";

ToolNetworkSecurity.isPrivateIp("10.0.0.1");     // true
ToolNetworkSecurity.isPrivateIp("169.254.169.254"); // true (cloud metadata)
ToolNetworkSecurity.isPrivateIp("::ffff:10.0.0.1"); // true (IPv4-mapped IPv6)

const result = await ToolNetworkSecurity.resolveAndValidate("api.example.com");
// { valid: true, ip: "203.0.113.1" }
```

Disponível via subpath `tyforge/tools/network-security` (Node.js only). Consumidores podem usar em override de `validateEndpointDns()` para adicionar proteção contra DNS rebinding.

## Próximos passos

- [TypeGuard](/guia/tools/type-guard) — referência completa de todos os métodos de verificação de tipo
