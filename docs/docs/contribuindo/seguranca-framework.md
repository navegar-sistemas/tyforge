---
title: Segurança do Framework
sidebar_position: 10
---

# Segurança do Framework

Esta página documenta as medidas de hardening de segurança implementadas na infraestrutura do TyForge — schema builder, batch processing, ferramentas internas e build pipeline. Para segurança de TypeFields específicos (autenticação, criptografia, tokens), consulte [Type Fields — Segurança](/docs/guia/type-fields/seguranca).

## Prototype pollution

O TyForge protege contra prototype pollution em dois pontos críticos onde dados externos são usados como chaves de objetos:

### batch-worker.ts (deserializeSchema)

O worker de processamento paralelo recebe schemas serializados via `postMessage`. Antes de reconstruir o schema, filtra chaves perigosas:

```typescript
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function deserializeSchema(raw: Record<string, unknown>): ISchema {
  for (const [key, value] of Object.entries(raw)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    // ... reconstruct schema safely
  }
}
```

Sem essa proteção, um payload malicioso poderia injetar `__proto__` no schema serializado e modificar o prototype de objetos no worker thread.

### ToolObjectTransform.unflatten()

O método `unflatten()` reconstrói objetos a partir de chaves com notação de ponto (ex: `"user.name"` -> `{ user: { name: ... } }`). Chaves que contenham segmentos perigosos são silenciosamente ignoradas:

```typescript
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

// During key segment processing:
if (keys.some(k => DANGEROUS_KEYS.has(k))) continue;
```

Isso previne que inputs como `"__proto__.polluted"` modifiquem o prototype chain de qualquer objeto.

## Prevenção de command injection

Todos os comandos executados pelo sistema de pre-commit usam `execFileSync` com array de argumentos separados — nunca `execSync` com interpolação de strings:

```typescript
// Correto: argumentos separados, sem shell
execFileSync("npm", ["run", "typecheck"], {
  stdio: "pipe", encoding: "utf-8", timeout: 120000,
});

// Nunca: interpolação de strings com shell
// execSync(`npm run ${userInput}`)  // PROIBIDO
```

`execFileSync` executa o binário diretamente sem invocar um shell intermediário. Isso elimina a possibilidade de injeção de comandos via metacaracteres do shell (`; && | $()` etc.), mesmo que algum argumento contenha caracteres especiais.

Essa regra se aplica a todos os checks em `src/pre-commit/checks/` e aos métodos auxiliares da classe base `Check` (`findFiles`, `isDockerAvailable`).

## Symlink traversal

O `ToolFileDiscovery` (`src/tools/file-discovery.tool.ts`) percorre diretórios recursivamente para buscar arquivos por extensão. O método `walkDirectory` ignora symlinks explicitamente:

```typescript
private walkDirectory(dir: string): string[] {
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue; // Symlinks ignored
    // ...
  }
}
```

Sem essa verificação, um symlink malicioso poderia apontar para fora do `rootDir` (ex: `/etc/passwd`, `../../sensitive-data/`) e expor arquivos do sistema. O `ToolFileDiscovery` é usado pelo linter para descobrir arquivos `.ts` — um symlink em `src/` apontando para fora do projeto poderia causar leitura de arquivos arbitrários.

## Numeric overflow

O `TypeGuard` (`src/tools/type_guard.ts`) rejeita `Infinity` e `-Infinity` em todas as validações numéricas usando `Number.isFinite()`:

```typescript
if (typeof value !== "number" || isNaN(value) || !Number.isFinite(value)) {
  // Reject: not a valid finite number
}
```

Isso se aplica a:
- `TypeGuard.isNumber()` — validação estática que retorna `Result`
- `TypeGuard.extractNumber()` — extração segura de número de `unknown`

Valores `Infinity` e `-Infinity` são tecnicamente números válidos em JavaScript (`typeof Infinity === "number"`), mas podem causar comportamentos inesperados em cálculos financeiros (ex: `FMoney`), limites de paginação, e qualquer lógica que dependa de comparações numéricas finitas.

## Recursion depth

Duas proteções contra recursão infinita em estruturas aninhadas:

### ToolObjectTransform.flatten()

O método `flatten()` aceita um parâmetro `maxDepth` (default: 100) que limita a profundidade de recursão:

```typescript
static flatten(
  obj: Record<string, unknown>,
  prefix = "",
  maxDepth = 100,
  depth = 0,
): Map<string, unknown> {
  const safeMaxDepth = Math.max(1, maxDepth);
  // Stops recursing when depth >= safeMaxDepth
}
```

### SchemaBuilder.maxDepth

O `SchemaBuilder` tem um limite configurável de profundidade para schemas aninhados (default: 50):

```typescript
private static _maxDepth = 50;

// During schema compilation:
if (depth >= SchemaBuilder.maxDepth) {
  throw new Error(
    `Schema nesting exceeds maximum depth of ${SchemaBuilder.maxDepth} at path: ${basePath}`
  );
}
```

O valor pode ser ajustado via `SchemaBuilder.maxDepth = N`, mas deve ser um inteiro positivo.

Ambas as proteções previnem stack overflow causado por objetos com referência circular ou schemas excessivamente profundos.

## Batch processing limits

O `batchCreate` do `SchemaBuilder` impõe limites rigorosos em cada parâmetro para prevenir abuso de recursos:

| Parâmetro | Limite | Descrição |
|-----------|--------|-----------|
| Total de items | 1000000 (1M) | Máximo de items por chamada `batchCreate` |
| Chunk size | 1 - 100000 (100K) | Tamanho de cada chunk enviado ao worker |
| Concurrency | 1 - 16 | Limitado pelo número de CPUs (`os.cpus().length`) |
| Worker timeout | 1s - 300s | Tempo máximo de execução por worker (default: 30s) |

```typescript
if (items.length > 1000000) {
  throw new Error("Batch size exceeds maximum of 1000000 items");
}
const concurrency = Math.max(1, Math.floor(options?.concurrency ?? 1));
const chunkSize = Math.max(1, Math.min(Math.floor(options?.chunkSize ?? 10000), 100000));
const maxConcurrency = Math.min(options.concurrency, nodeOs.cpus().length, 16);
const timeout = Math.max(1000, Math.min(options.workerTimeout ?? 30000, 300000));
```

O worker também valida independentemente: rejeita chunks com mais de 100000 items, mesmo que o orquestrador tente enviar mais.

## Worker thread safety

O processamento paralelo (`src/schema/batch-parallel.ts`) implementa múltiplas camadas de segurança para workers:

### Cleanup garantido

Todo worker tem cleanup no bloco `finally`, garantindo que recursos sejam liberados mesmo em caso de erro ou timeout:

```typescript
try {
  const result = await workerDone;
  resultMap.set(localIndex, result);
} finally {
  clearTimeout(timer);
  worker.removeAllListeners(); // Prevent memory leaks
  await worker.terminate();    // Graceful shutdown
}
```

### Timeout com rejeição

Cada worker tem um timer que rejeita a Promise e termina o worker se o processamento exceder o timeout configurado:

```typescript
timer = setTimeout(() => {
  worker.removeAllListeners();
  worker.terminate();
  reject(new Error("Worker timed out after " + workerTimeout + "ms"));
}, workerTimeout);
```

### Resultados indexados por Map

Os resultados dos workers são armazenados em um `Map<number, IWorkerResult>` indexado pelo índice do chunk — não por ordem de chegada (`push`). Isso garante que a reconstrução final respeita a ordem original dos items, independentemente de qual worker termine primeiro.

### Terminação em cascata

Se qualquer worker falhar com erro, todos os workers ativos são terminados imediatamente:

```typescript
try {
  await Promise.all(workerPromises);
} catch (err) {
  await Promise.all(activeWorkers.map(w => w.terminate()));
  throw err;
}
```

## CSP hash generation

O script `docs/generate-csp.js` fortalece a Content Security Policy da documentação substituindo `'unsafe-inline'` por hashes SHA-256 exatos dos inline scripts gerados pelo Docusaurus.

### Fluxo

1. Após o `npm run build`, o script percorre todos os HTMLs em `docs/build/`
2. Extrai o conteúdo de cada `<script>` inline (sem atributo `src`)
3. Calcula o hash SHA-256 de cada script e formata como `'sha256-<base64>'`
4. Substitui `'unsafe-inline'` na diretiva `script-src` do `nginx.conf` pelos hashes coletados

```javascript
// Extract inline scripts and compute SHA-256 hashes
for (const script of extractInlineScripts(html)) {
  hashes.add(`'sha256-${sha256Hash(script)}'`);
}

// Replace in nginx.conf
conf = conf.replace(
  /script-src 'self' 'unsafe-inline'/g,
  `script-src 'self' ${hashList}`,
);
```

### Verificação no Dockerfile

O Dockerfile da documentação verifica que a substituição foi feita com sucesso. Se `'unsafe-inline'` ainda estiver presente na diretiva `script-src` após o build, a imagem Docker falha ao construir:

```dockerfile
RUN npm run build && node generate-csp.js && rm -rf node_modules

# Verify: script-src no longer contains unsafe-inline
RUN ! grep -q "script-src[^;]*unsafe-inline" /app/nginx.conf \
    || (echo "ERROR: generate-csp.js failed to replace unsafe-inline in script-src" && exit 1)
```

Isso garante que nenhuma imagem de produção seja publicada com `'unsafe-inline'` na política de scripts.

## Prevenção de XSS

O TyForge adota duas práticas para prevenir Cross-Site Scripting:

### Mensagens de exceção sem user input

As mensagens de `ExceptionValidation` nunca incluem o valor fornecido pelo usuário — apenas o nome do campo e a descrição da regra violada. Isso evita que um atacante injete HTML/JavaScript via input que seria refletido em mensagens de erro na UI.

Exemplo — o que o TyForge faz:

```
"O campo 'email' deve ser um email válido"
```

Exemplo — o que o TyForge **nunca** faz:

```
"O valor '<script>alert(1)</script>' não é um email válido"
```

### Campos sensíveis via expose

Campos sensíveis (senhas, tokens, chaves) são controlados via `expose: "redacted"` no schema, em vez de override de `toJSON()` no TypeField individual:

```typescript
const schema = {
  email: { type: FEmail, expose: "private" },
  password: { type: FPassword, expose: "redacted" },
} satisfies ISchema;
```

O método `toJSON()` do domain model respeita o nível de exposição:

| Nível | Comportamento |
|-------|---------------|
| `"public"` (default) | Oculta campos `private` e `redacted` |
| `"private"` | Oculta apenas campos `redacted` |
| `"redacted"` | Exibe todos os campos |

Isso centraliza o controle de visibilidade no schema — o TypeField não precisa saber se deve ou não expor seu valor.
