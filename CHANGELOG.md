# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Full history at [docs/CHANGELOG](docs/docs/guia/CHANGELOG.md).

## [0.2.4] - 2026-03-30

### Fixed
- Runtime crash em React Native/Hermes: `react-native` field no formato objeto corrompia resolução de módulos no Metro — removido

### Added
- Pacote `@tyforge/guard` — análise estática separada do core com regras classificadas em typescript, convention, architecture e dsl

### Changed
- Lint movido de `packages/tyforge/src/lint` para `packages/guard` (`@tyforge/guard`)
- CLI renomeado de `tyforge-lint` para `tyforge-guard`
- `@tyforge/http`, `@tyforge/graphql`, `@tyforge/websocket` atualizados para `0.1.4`

## [0.2.3] - 2026-03-30

### Added
- Browser/React Native stubs para `TyForgeConfig`, `ToolNetworkSecurity` e `ServiceBase` via `browser` e `react-native` fields no package.json
- Exemplo React Native com Expo para teste de compatibilidade
- Pacote `@tyforge/examples` com exemplos simples e React Native

### Changed
- Exemplos movidos de `packages/tyforge/src/examples` para `packages/examples/simple`
- `@tyforge/http`, `@tyforge/graphql`, `@tyforge/websocket` atualizados para `0.1.3`

## [0.2.2] - 2026-03-30

### Fixed
- Nginx container restart loop: `mkdir() "/var/cache/nginx/client_temp" failed (13: Permission denied)` — diretórios temp criados no Dockerfile com `chown nginx:nginx` e tmpfs montado com `uid=101,gid=101`

### Changed
- `@tyforge/http`, `@tyforge/graphql`, `@tyforge/websocket` atualizados para `0.1.2`
- `peerDependencies` e `devDependencies` atualizados para `tyforge@0.2.2`

## [0.2.1] - 2026-03-30

### Added
- README.md em todos os pacotes (`packages/tyforge`, `packages/http`, `packages/graphql`, `packages/websocket`)

### Changed
- `@tyforge/http`, `@tyforge/graphql`, `@tyforge/websocket` atualizados para `0.1.1`
- `peerDependencies` e `devDependencies` atualizados para `tyforge@0.2.1`

## [0.2.0] - 2026-03-29

### Added
- Monorepo com npm workspaces: `packages/tyforge`, `packages/http`, `packages/graphql`, `packages/websocket`
- Pacote `@tyforge/websocket`: `ServiceWebSocket` com connect/disconnect/send/subscribe/unsubscribe, reconnect com jitter e delay cap, `ExceptionWebSocket` com 8 factory methods, `ServiceWebSocketSecurity` com sanitização recursiva
- `ServiceBase` — classe abstrata base para todos os serviços (HTTP, GraphQL, WebSocket) com `endpoint`, `getAuthHeaders` e `validateEndpointDns`
- `ToolNetworkSecurity` — resolução DNS e validação contra ranges privados (SSRF protection)
- `ICreatableStatic<TInstance>` no schema type system — permite ValueObjects como tipo de campo no schema
- `Paginated` — ValueObject com schema, `create`/`assign` schema-compatible, getter/setter para `totalItems`, `totalPages` derivado
- `FSortOrder` — TypeField enum para ordenação (`asc`/`desc`)
- `IRepositoryCore` → `Repository` (classe abstrata base), `RepositoryRead`, `RepositoryWrite`, `RepositoryCrud`
- `IRepositoryWrite` — interface segregada para operações de escrita
- Lint rule AST `no-invalid-factory-signature` — valida que classes schema-compatible têm `create/assign(raw, fieldPath)` com nomes e tipos corretos
- Lint rule AST `no-public-constructor-domain` — valida constructor private/protected e `new` somente em `create`/`assign`
- `AstAnalyzer` e `AstRule` — infraestrutura AST no linter via TypeScript compiler API com resolução completa de herança
- `TyForgeConfig` — classe com Result pattern para carregamento de configuração
- `OValidateLevel`, `ORuleSeverity`, `TRuleSeverity` — const enums para configuração
- `OBackoffStrategy`, `TBackoffStrategy` — const enum para estratégia de retry
- `OCircuitBreakerState`, `TCircuitBreakerState` — const enum para estado do circuit breaker
- `DomainEventDispatcher` — tipagem forte com `FString`, `FInt`, `Result`, `Exceptions`

### Changed
- `ServiceHttp`, `ServiceGraphQL`, `ServiceWebSocket` agora extendem `ServiceBase`
- `ServiceHttp.baseUrl` renomeado para `endpoint` (contrato de `ServiceBase`)
- Sanitização recursiva (GraphQL/WebSocket) retorna `Result` — profundidade excedida gera erro explícito
- `Paginated` extende `ValueObject` (não `ClassDomainModels` direto)
- `Paginated.create` e `assign` são schema-compatible `(raw: T, fieldPath: string)`
- Repositórios migrados de interfaces para classes abstratas (`Repository`, `RepositoryRead`, `RepositoryWrite`, `RepositoryCrud`)
- `IRepositoryOptions` removido — transações gerenciadas por `IUnitOfWork`
- `IAuditEntry`, `IOutboxEntry` — primitivos substituídos por TypeFields
- `ICircuitBreakerConfig`, `IRetryPolicyConfig` — primitivos substituídos por TypeFields, union literals por const enums
- `ExceptionUnexpected.log` agora non-enumerable
- `DomainEvent` e `IntegrationEvent` — removidos `assertQueueName`/`assertSource` redundantes e `toJSON` override desnecessário
- `TQueueName` type alias removido (queueName agora é `FString`)
- `IPaginationParams.sortOrder` agora usa `FSortOrder` em vez de union literal
- `Paginated.totalItems` renomeado de `total` (ambíguo)

### Security
- SSRF: bloqueio de IPs privados em `FUrlOrigin` (10.x, 172.16-31.x, 192.168.x, 169.254.x, 127.x, CGNAT, IPv6)
- SSRF: DNS rebinding protection via `validateEndpointDns()` em todos os serviços
- SSRF: `redirect: "error"` em fetch HTTP e GraphQL
- DoS: limite de 10MB em respostas HTTP/GraphQL
- DoS: profundidade máxima 50 na sanitização recursiva (GraphQL/WebSocket)
- DoS: WebSocket reconnect com jitter (50-100%) e delay cap 30s
- DoS: timeout GraphQL validado 1-300000ms
- DoS: limite 1MB no config loader do linter
- Filesystem: symlink check via `lstatSync` antes de write em hook setup
- Filesystem: path traversal validation no lint config writer
- Info disclosure: `ExceptionUnexpected.log` non-enumerable
- ReDoS: regex ancorada com `^$` em `matchGlob`
- Prototype pollution: `DANGEROUS_KEYS` filtering em `MapCreatableHandler` (SchemaBuilder isMap)
- SSRF: IPv4-mapped IPv6 (`::ffff:10.0.0.1`) detection em `ToolNetworkSecurity`
- DoS: limite de 10MB em mensagens WebSocket antes do `JSON.parse`

## [0.1.30] - 2026-03-29

### Added
- Módulo GraphQL (`tyforge/graphql`): abstração de GraphQL client com `ServiceGraphQL`, `ServiceGraphQLSecurity` e `ExceptionGraphQL`
- `ServiceGraphQL`: classe abstrata base com `fetch()` nativo, Result pattern e métodos `query()` e `mutation()`
- `ServiceGraphQLSecurity`: bloqueio de introspection queries, sanitização recursiva de variables contra prototype pollution, validação HTTPS
- `ExceptionGraphQL`: exceções GraphQL com factory methods (`queryFailed`, `mutationFailed`, `networkError`, `unauthorized`, `timeout`, `invalidResponse`, `unsafeQuery`)
- Detecção automática de `UNAUTHENTICATED` via `extensions.code` ou `message` nos erros GraphQL
- Extração automática de `operationName` do document GraphQL
- Subpath export `tyforge/graphql` no `package.json`
- Testes para `ServiceGraphQL`, `ServiceGraphQLSecurity` e `ExceptionGraphQL`
- Documentação do módulo GraphQL

## [0.1.29] - 2026-03-28

### Added
- Módulo HTTP (`tyforge/http`): abstração de HTTP client com `ServiceHttp`, `ServiceHttpSecurity` e `ExceptionHttp`
- `ServiceHttp`: classe abstrata base com `fetch()` nativo, Result pattern e métodos de conveniência (`get`, `post`, `put`, `delete`, `patch`)
- `ServiceHttpSecurity`: prevenção de path traversal, SSRF, CRLF injection, null bytes e prototype pollution em headers
- `ExceptionHttp`: exceções HTTP com factory methods (`unsafeEndpoint`, `failedUrlConstruction`, `failedSerialization`, `externalApiFailed`, `authFailed`, `timeout`)
- Suporte a timeout via `AbortController` com upper bound de 300s
- Validação de valores não-primitivos em query params e form body (rejeita objetos/arrays)
- Proteção contra vazamento de dados externos via `externalError` non-enumerable
- Campo `retriable` correto por factory method (apenas `externalApiFailed` e `timeout` são retriáveis)
- Subpath export `tyforge/http` no `package.json`
- Testes para `ServiceHttp`, `ServiceHttpSecurity` e `ExceptionHttp`
- Documentação do módulo HTTP

### Changed
- `IExternalError` agora exportada nos barrels (`http/index.ts` e `index.ts`)
- `IRequestOptions` renomeada para `TRequestOptions` — agora derivada via `Omit<IRequestParams, "endpoint" | "method" | "data">` (zero duplicação)
- `ExceptionHttp.authFailed(cause?)` agora aceita o erro original e o armazena via `Error.cause` (non-enumerable)

## [0.1.28] - 2026-03-28

### Added
- ESM output — `"type": "module"` in package.json, `module: "ES2022"` in tsconfig, tsdown as build tool
- Pre-commit system rewritten in TypeScript OOP (`src/pre-commit/`) — 7 checks (6 blocking + 1 confirmable)
- `CheckDeprecated` — blocks commit if any dependency is deprecated (uses `execFileSync`, deduplication)
- `CheckVersions` — pinned version enforcement, npm outdated/audit cross-reference, Docker Hub API version check, CSP workaround monitor
- `generate-csp.js` — post-build script extracts SHA-256 hashes of inline scripts, replaces `unsafe-inline` in nginx CSP
- Contributing docs: `pre-commit.md`, `seguranca-framework.md` — new pages documenting pre-commit architecture and framework security hardening
- `TypeGuard.isNumber()` — rejects `Infinity`/`-Infinity` with `Number.isFinite()` (matches `extractNumber()`)
- `ToolObjectTransform.flatten()` — `maxDepth` parameter (default 100) with negative value validation
- `ToolFileDiscovery.walkDirectory()` — skips symlinks to prevent directory traversal
- Batch processing limits: batchCreate max 1M items, worker max 100K per chunk, concurrency 1-16, workerTimeout 1s-300s
- `DANGEROUS_KEYS` filter in `batch-worker.ts` deserializeSchema (prototype pollution prevention)
- HSTS header in nginx.conf (server + location blocks)
- Gzip compression in nginx.conf
- `package.json` files excludes `dist/**/*.js.map` from npm package

### Changed
- **BREAKING:** Output format changed from CommonJS to ESM (`"type": "module"`)
- **BREAKING:** Build tool changed from `tsc && tsc-alias` to `tsdown`
- **BREAKING:** `uuid` updated from ^11 (CJS) to 13.0.0 (ESM-only, types included)
- **BREAKING:** `@types/uuid` removed (uuid v13 includes own types)
- TypeScript updated from 5.9.3 to 6.0.2
- React updated from 18.3.1 to 19.2.4
- Docusaurus updated from 3.8.1 to 3.9.2 (all packages aligned)
- Node Docker images updated to 24.14.1-alpine (8 CVEs fixed)
- Nginx Docker image updated to 1.28.3-alpine (9 CVEs fixed)
- All dependency versions pinned (no `^`, `~`, `>=` in any package.json)
- `serialize-javascript` vulnerability resolved via npm overrides (7.0.5)
- `.husky/pre-commit` reduced to 2 lines (`npx tsx src/pre-commit/index.ts`)
- All `execSync` in pre-commit replaced with `execFileSync` (command injection prevention)
- Worker threads: `removeAllListeners()` + `await terminate()` in finally, timeout rejects Promise
- `batch-worker.ts` imports reordered, `parentPort?.postMessage` → `port.postMessage`
- `SchemaBuilder.compile()` — `create<T>` and `assign<T>` with generics (removed `createUnknown`/`assignUnknown`)
- `TAssignUnknown` renamed to `TAssignFn`
- `file-discovery.tool.ts` — glob `?` now matches `[^/]` (not `/`)
- Docker: `USER nginx` (prod) and `USER node` (dev) — no longer runs as root
- Dockerfile smoke tests: `nginx -t` + `index.html` exists + CSP verification
- Contributing docs: `docker.md` rewritten, `desenvolvimento.md` updated with ESM/TS6/React19/pre-commit
- Removed numeric counts from all documentation (TypeFields, exceptions) to prevent staleness

### Fixed
- 0 npm vulnerabilities (root + docs)
- CSP `unsafe-inline` replaced with SHA-256 hashes for inline scripts (generated per build)
- Non-interactive terminal now blocks commit instead of auto-approving

## [0.1.27] - 2026-03-27

### Added
- `TLocaleRegion` type — strict union (`"us" | "br"`) for country business rules (replaces `TLocaleRules`)
- `TLocaleData` type — strict union (`"us" | "br"`) for API/persistence formatting
- `TFormatTarget` type — `"display" | "data"` parameter for `formatted(target?)` method
- `LOCALE_INTL_DISPLAY` and `LOCALE_INTL_DATA` — separate exhaustive Record maps from locale to BCP 47 Intl codes

### Changed
- **BREAKING:** `localeRules` renamed to `localeRegion` (`TLocaleRules` → `TLocaleRegion`)
- **BREAKING:** `TypeField.configure()` now accepts `localeRegion` and `localeData` (3 independent axes)
- `formatted(target?: TFormatTarget)` — accepts optional target parameter (`"display"` default, `"data"` for API/persistence)
- `formatNumber()` unified with `target` parameter — replaces separate `formatDataNumber()` method
- Documentation: all `dataFormatted()` references replaced with `formatted("data")`
- Documentation: all `localeRules` references replaced with `localeRegion`

## [0.1.26] - 2026-03-27

### Added
- `TLocaleDisplay` type — strict union (`"us" | "br"`) for formatting locale (controls `formatted()`, `formatNumber()`)
- `TLocaleRules` type — strict union (`"us" | "br"`) for validation locale (controls business rules in `validateRules()`)
- `LOCALE_INTL: Record<TLocaleDisplay, string>` — exhaustive map from locale to BCP 47 Intl codes
- `TypeField.assertNeverLocale()` — compile-time exhaustiveness guard for locale switches
- `TypeField.formatNumber()` — locale-aware number formatting in base class (used by FMoney, FCurrency, FInt, FFloat)
- Locale-aware `formatted()` in `FMoney`, `FCurrency`, `FFloat`, `FInt` — respects `localeDisplay`
- Contributing docs: `convencoes.md` — naming conventions, coding standards, prohibitions
- Contributing docs: `criando-type-fields.md` — complete guide for creating new TypeFields
- Contributing docs: `testes.md` — test runner, patterns, controlled exceptions
- `Intl.NumberFormat` cache in `formatNumber()` — ~50x faster than uncached `toLocaleString`

### Changed
- **BREAKING:** `TypeField.locale: string` replaced by `TypeField.localeDisplay: TLocaleDisplay` and `TypeField.localeRules: TLocaleRules`
- **BREAKING:** `TypeField.configure({ locale })` replaced by `TypeField.configure({ localeDisplay, localeRules })`
- **BREAKING:** Default locale changed from `"international"` to `"us"`
- `configure()` now uses `!== undefined` checks instead of truthy checks (prevents silent swallowing of falsy values)
- 5 locale-aware TypeFields (FBankCode, FBankBranch, FBankAccountNumber, FStateCode, FDocumentId) refactored to exhaustive switch on `TypeField.localeRules` with `assertNeverLocale()` default
- `FInt` descriptions translated from Portuguese to English
- Contributing docs: `desenvolvimento.md` rewritten with updated prerequisites, all commands, Docker, Husky hooks
- Contributing docs: `arquitetura.md` updated with 50+ TypeFields, current tool names, Application/Infrastructure in diagram
- Contributing docs: Portuguese accents fixed across all 5 existing files (~100+ corrections)
- `FFloat.formatted()` now respects `decimalPrecision` config (was truncating to 3 decimals)
- `FDocumentId` generic alphanumeric validation moved before locale switch (consistent with other TypeFields)
- README.md and README.pt-BR.md rewritten with 12 code examples, commercial sections (humans, AI, full-stack), and complete TypeField catalog
- Sidebar labels: Portuguese accents fixed, all categories default to collapsed
- Sidebar: added 3 new contributing pages (Convenções, Criando TypeFields, Testes)

### Fixed
- Adding a new locale to `TLocaleDisplay` or `TLocaleRules` now causes TypeScript compile errors at every location that needs locale-specific handling



