# Contexto completo — TyForge Monorepo

## O que é o TyForge

TyForge é um framework TypeScript que fornece validação de schemas type-safe, Result pattern e building blocks de Domain-Driven Design. Publicado como ESM (ES2022, Node.js >=24) no npm. A filosofia é zero boilerplate: instalar, importar, usar.

## Monorepo — 5 pacotes npm

| Pacote | Versão atual | Publicado no npm | Descrição |
|--------|-------------|------------------|-----------|
| `tyforge` | 0.2.13 | 0.2.12 | Core: TypeFields, Schema, Result, Exceptions, Domain Models, Tools, Pre-commit |
| `@tyforge/http` | 0.1.11 | 0.1.10 | HTTP client type-safe com ServiceHttp, security hardening, redirect blocking |
| `@tyforge/graphql` | 0.2.0 | 0.1.10 | GraphQL client com `graphql-request`, introspection blocking, variable sanitization |
| `@tyforge/websocket` | 0.1.11 | 0.1.10 | WebSocket client com reconnect, backoff+jitter, message sanitization |
| `@tyforge/guard` | 0.1.6 | 0.1.5 | Lint/análise estática: 17 regras em 4 categorias (typescript/convention/architecture/dsl) |

**Nenhuma dessas versões foi publicada ainda.** Todas precisam de `npm publish --workspaces`.

## Mudanças não commitadas (15 arquivos)

### `@tyforge/graphql` — reescrita com graphql-request (BREAKING)

**Problema resolvido:** Double-serialization de variáveis. O schema usava `variables: { type: FString, keyType: FString, isMap: true }` que forçava objetos complexos por FString, causando `JSON.stringify` duplo.

**Mudanças:**

1. **`dto-graphql-request.ts`** — `variables` mudou de `Record<string, FString>` (isMap) para `FJson`
2. **`service-graphql.types.ts`** — `IGraphQLRequest.variables` agora é `FJson`, removido `FFetchPolicy` não utilizado
3. **`service-graphql.base.ts`** — reescrita completa:
   - Usa `GraphQLClient` e `ClientError` de `graphql-request` (v7.4.0) como transport layer
   - Mantém camada de segurança TyForge: introspection blocking, variable sanitization, DNS validation, header sanitization
   - Null-data guard: retorna `invalidResponse` quando `client.request()` retorna `null`/`undefined`
   - HTTP 5xx em `ClientError` mapeado para `networkError` (antes era `invalidResponse`)
   - `IGraphQLError` mapeado via `.map()` em vez de type predicate (compatível com `GraphQLError` do pacote `graphql`)
   - Removed `unwrapStringMap()` (causava double-serialization)
4. **`tsdown.config.ts`** — `neverBundle: ["tyforge", "graphql-request", "graphql"]`
5. **`package.json`** — adicionou `dependencies: { "graphql": "16.13.2", "graphql-request": "7.4.0" }`, version 0.2.0
6. **`__tests__/service-graphql.test.ts`** — reescrita completa:
   - Mock usa `new Response()` nativo (Node.js 24) em vez de objetos parciais
   - Headers assertions em lowercase (`authorization`, `x-custom`) — `Headers` normaliza
   - operationName tests verificam error handling (comportamento real), não body do request (controlado pelo graphql-request)
   - 61/61 testes passando, typecheck limpo

### `tyforge` core

7. **`pre-commit/index.ts`** — `CheckPublishReady` movido de posição 7 para posição 3 (após typecheck e tests, antes de lint)

### Versões e dependências

8. **`packages/tyforge/package.json`** — 0.2.12 → 0.2.13
9. **`packages/graphql/package.json`** — 0.1.10 → 0.2.0, peer/dev tyforge 0.2.13
10. **`packages/http/package.json`** — 0.1.10 → 0.1.11, peer/dev tyforge 0.2.13
11. **`packages/websocket/package.json`** — 0.1.10 → 0.1.11, peer/dev tyforge 0.2.13
12. **`packages/guard/package.json`** — 0.1.5 → 0.1.6, dev tyforge 0.2.13
13. **`package-lock.json`** — atualizado com novas dependências graphql/graphql-request
14. **`CHANGELOG.md`** (raiz) — entry 0.2.13 adicionada, entry 0.2.1 removida (manter 10)
15. **`docs/docs/guia/CHANGELOG.md`** — entry 0.2.13 adicionada (histórico completo)

### Arquivos novos (não tracked)

- **`prompts/react-native.md`** — template CLAUDE.md para projetos React Native + TyForge
- **`prompts/security.md`** — template CLAUDE.md para security audit/hardening com TyForge
- **`prompts/context.md`** — este arquivo

## Verificações realizadas

- `npm run build` — 5/5 pacotes OK
- `npm run typecheck --workspace=packages/graphql` — zero erros
- `npm run test --workspace=packages/graphql` — 61/61 passando
- `npm run precommit` — falhou em publish-ready (versões iguais às do npm) → bumped → precisa rodar novamente

## O que falta fazer

### Imediato (para commitar)

1. **Rodar `npm run precommit` da raiz** para verificar que todas as checks passam com as novas versões
   - IMPORTANTE: rodar da raiz (`/tyforge/`), não de `packages/tyforge/`
   - O user pode estar com cwd em `packages/tyforge/` — verificar
2. **Commitar** todas as mudanças (incluindo prompts/)
3. **Publicar** com `npm publish --workspaces` da raiz

### Pendências de sessões anteriores

4. **Security findings não resolvidos:**
   - R3: IP representation bypass (octal `0177.0.0.1`, hex `0x7f.0.0.1` não bloqueados por `isPrivateIp`)
   - R7: Sem timeout default em HTTP/GraphQL — requests sem `timeout` no DTO ficam sem limite
   - R12: Dockerfile sandbox usa tag `node:24-slim` (mutável) — considerar digest pin
   - R13: TOCTOU em hook setup do guard (check existence → write não é atômico)

5. **`@tyforge/websocket@0.1.10` nunca foi publicado no npm** — 0.1.11 será a primeira publicação real

6. **Script `npm run release`** na raiz precisa ser testado/implementado

7. **Documentação** do graphql-request integration (README do @tyforge/graphql)

## Arquitetura relevante

### Services — cadeia de segurança

```
Input → DtoGraphQLRequest (FJson variables) → introspection check → variable sanitization
→ auth headers → header sanitization → DNS validation → GraphQLClient (graphql-request)
→ redirect: "error" → response → null-data check → ClientError mapping → Result<T, Exceptions>
```

### Pre-commit — ordem de execução

```
[1/8] typecheck
[2/8] tests
[3/8] publish ready     ← movido para cima nesta sessão
[4/8] lint (guard)
[5/8] docs build
[6/8] Docker build
[7/8] deprecated packages
[8/8] version check (confirmable)
```

### Conditional exports React Native

```
tyforge/                    → funciona
tyforge/result              → funciona
tyforge/type-fields         → funciona
tyforge/schema              → funciona (parallel degrada para sequencial)
tyforge/exceptions          → funciona
tyforge/tools               → funciona
tyforge/config              → BLOQUEADO (react-native: null)
tyforge/tools/network-security → BLOQUEADO (react-native: null)
tyforge/infrastructure/service-base → BLOQUEADO (react-native: null)
```

Metro não suporta `exports` nativamente — `metro.config.js` com `resolveRequest` manual obrigatório. Exemplo em `examples/react-native/metro.config.js`.

## Convenções críticas do projeto

- **Conventional Commits** em português, sem Co-Authored-By/Claude/IA
- **Dependências pinadas** — versão exata, sem `^`, `~`, `*`
- **Zero `any`, `as`, `!`, `@ts-ignore`, `export default`**
- **Prefixos**: F (TypeFields), T (types), I (interfaces), O (const objects), E (const enums), Dto, DtoReq, DtoRes, Exception, Event, Repository, Mapper
- **CHANGELOG**: raiz = 10 últimas versões, docs = completo, nunca alterar entries commitados
- **Build limpo**: zero erros E zero warnings em typecheck, test, lint, build
- **Pre-commit**: nunca commitar com erros/warnings. Warnings de versão requerem aprovação do usuário
- **`git stash` proibido** a menos que o usuário mande explicitamente
- **Comando "change"**: verificar versão no npm, incrementar se necessário, atualizar CHANGELOGs e peerDeps
- **Segurança > Performance > SOLID > Clean Code** — nesta ordem absoluta
