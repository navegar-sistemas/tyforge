---
id: CHANGELOG
title: Changelog
sidebar_position: 0
---

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.2.9] - 2026-03-31

### Fixed
- `CheckPublishReady` agora verifica TODOS os pacotes do monorepo (antes verificava apenas o core porque `find .` rodava do cwd `packages/tyforge`)

## [0.2.8] - 2026-03-31

### Fixed
- `CheckPublishReady`: distingue npm offline (erro) de pacote não publicado (OK)
- `CheckLint`: verifica se guard binary existe antes de executar
- Guard: `no-console.rule.ts` referenciava path antigo `"lint/"` — corrigido para `"guard/"`

### Removed
- 3 browser stubs redundantes (`tyforge-config.browser`, `network-security.browser`, `service.base.browser`) — barrel principal já não importa `node:`
- 3 entries mortos do `browser` field no `package.json` — mantém apenas `batch-parallel`

### Changed
- Documentação de `ToolNetworkSecurity` corrigida — não é chamado automaticamente, disponível via subpath para override

## [0.2.7] - 2026-03-31

### Fixed
- `@tyforge/http`, `@tyforge/graphql`, `@tyforge/websocket` (`0.1.8`): `ToolNetworkSecurity` via lazy `await import()` — elimina `node:dns/promises` do bundle React Native

### Changed
- `CheckVersions` agora é blocking — bloqueia commit se versão já publicada no npm ou peerDependencies desatualizadas

## [0.2.6.1] - 2026-03-31

### Fixed
- `@tyforge/http`, `@tyforge/graphql`, `@tyforge/websocket` (`0.1.7`): `ToolNetworkSecurity` agora importado via `await import()` (lazy) em vez de import estático — elimina `node:dns/promises` do bundle React Native

## [0.2.6] - 2026-03-31

### Changed
- `ServiceBase.validateEndpointDns()` agora retorna `true` por padrão — DNS validation movida para os pacotes de serviço (`@tyforge/http`, `@tyforge/graphql`, `@tyforge/websocket`) via override
- `ServiceBase` re-exportado no barrel principal — zero dependências `node:`, seguro para React Native/browser
- `@tyforge/http`, `@tyforge/graphql`, `@tyforge/websocket` atualizados para `0.1.6`

## [0.2.5] - 2026-03-30

### Added
- Conditional exports com condição `react-native` — subpaths universais resolvem normalmente, subpaths Node.js-only (`./config`, `./tools/network-security`, `./infrastructure/service-base`) retornam `PackagePathNotExportedError` em build-time no Metro

### Changed
- `@tyforge/http`, `@tyforge/graphql`, `@tyforge/websocket` atualizados para `0.1.5`
- `@tyforge/guard` atualizado para `0.1.1`
- `peerDependencies` e `devDependencies` atualizados para `tyforge@0.2.5`

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

## [0.1.25] - 2026-03-27

### Added
- Husky pre-commit hooks — shared across all contributors via `.husky/pre-commit`
- Pre-commit runs 5 checks: typecheck, tests, tyforge-lint, docs build (local), docs Docker build (production)
- `"prepare": "husky"` in package.json — hooks install automatically on `npm install`
- `SchemaBuilder.maxDepth` — configurable maximum schema nesting depth (default: 50, validated via getter/setter)
- CPF/CNPJ check digit validation (mod 11 algorithm) in `FDocumentCpf`, `FDocumentCnpj`, `FDocumentCpfOrCnpj`
- `FCurrency.formCreate()` and `FCurrency.formAssign()` — form input normalization for decimal currency
- `seguranca.md` — documentation page for security TypeFields

### Changed
- Replaced native `.git/hooks/pre-commit` with Husky (committed to git, shared across team)
- Worker timeout now configurable via `IBatchCreateOptions.workerTimeout` (default: 30s)
- PIX key validation: stricter email (`user@domain.tld`) and phone (`+digits 10-15`) format checks
- `FPassword` complexity documented as ASCII-only per NIST SP 800-63B
- `FTotpSecret` base32 regex fixed to reject scattered padding

### Fixed
- `batch-parallel.ts`: clearTimeout moved to finally block (prevents timer memory leak on rejection)
- `batch-parallel.ts`: worker results collected via indexed Map (prevents race condition)
- `batch-parallel.ts`: worker termination now properly awaited on error
- `TypeGuard.isEnumKey`: type guard added before `.toString()` — rejects non-string/non-number input (prevents type coercion bypass)
- User input removed from all ExceptionValidation error messages (prevents XSS when messages are rendered in HTML)

## [0.1.24] - 2026-03-27

### Changed
- `TypeField.applyMask()` changed to `protected static` — only accessible by subclasses via `formatted()`
- Document TypeFields now call `applyMask` via own class name instead of `TypeField.applyMask()`
- Removed standalone `mask.util.ts` — moved to base class
- nginx.conf: removed duplicate security headers (handled by host reverse proxy)
- Dockerfile.dev: added `COPY . .` for standalone builds
- Dockerfile: added `rm -rf node_modules` after build to reduce cache
- Sidebar: added Changelog and new TypeField categories (Moeda, Documentos, Bancário, PIX, Segurança, Enums)

## [0.1.23] - 2026-03-27

### Added
- `applyMask()` shared utility (`mask.util.ts`) for progressive document masking

### Fixed
- Portuguese error messages translated to English in `FInt`, `FPageNumber`, `FPageSize`
- `formatted()` return type aliases fixed in `FInt`, `FBoolean`, `FPageNumber`, `FPageSize`
- `applyMask` deduplicated — extracted from 3 document files to shared `mask.util.ts`
- Documentation: corrected Portuguese accents across all Docusaurus pages

## [0.1.22] - 2026-03-27

### Added
- `FMoney` TypeField — monetary values stored as integer cents (zero floating point)
- `FCurrency` TypeField — decimal convenience layer extending FMoney (accepts 10.50, stores 1050)
- `FIdentifier` TypeField — UUID base class for all ID types
- Money arithmetic: `add()`, `subtract()` (integer-safe, inherited by FCurrency)
- Money comparisons: `isZero()`, `isPositive()`, `isNegative()`, `isGreaterThan()`, `isLessThan()`, `isEqualTo()`
- Money factory: `FMoney.zero()`, `FMoney.fromDecimal()`, `toDecimal()`
- Banking TypeFields: `FBankCode`, `FBankBranch`, `FBankAccountNumber`, `FBankNsu`, `FBankE2eId`, `FEmvQrCodePayload`
- Identifier TypeFields: `FTransactionId`, `FDeviceId`, `FCorrelationId`, `FReconciliationId`, `FIdempotencyKey`, `FCertificateThumbprint` (extend FIdentifier)
- Document TypeFields: `FDocumentCpf`, `FDocumentCnpj`, `FDocumentCpfOrCnpj`, `FDocumentRg`, `FDocumentId`, `FDocumentType`, `FDocumentStateRegistration`, `FDocumentMunicipalRegistration`
- Security TypeFields: `FTotpCode`, `FTotpSecret`
- PIX TypeFields: `FPixKey`, `FPixKeyType` (with `OPixKeyType`)
- Enum TypeFields: `FPersonType`, `FGender`, `FMaritalStatus`, `FTransactionStatus`
- Other TypeFields: `FStateCode`, `FFloat`, `FBusinessName`
- TypeField locale system: `TypeField.configure({ locale: "br" })` for locale-aware validation
- Subpath exports in package.json: `tyforge/result`, `tyforge/type-fields`, `tyforge/exceptions`, `tyforge/schema`, `tyforge/tools`
- Dynamic `import()` for batch-parallel — fixes Metro bundler crash on React Native

### Fixed
- Metro/React Native: `node:worker_threads` no longer loaded at top level in any import chain
- `batchCreate()` with `concurrency > 1` silently falls back to sequential on browser/React Native

## [0.1.19] - 2026-03-27

### Added
- `browser` field in package.json — transparent Node.js/browser module substitution
- `batch-parallel.browser.ts` stub for browser/React Native environments
- `IParallelProcessor` interface, `IBatchCreateResult` type, `TAssignUnknown` type
- `createParallelProcessor()` factory function (replaces direct class export)
- `E` prefix convention for pure TypeScript `const enum` declarations

### Changed
- Batch parallel module refactored: dependency injection via `assignUnknown` parameter eliminates circular dependency with `schema-build.ts`
- `IBatchCreateError`, `IBatchCreateOptions`, `IBatchCreateResult` moved to `schema-types.ts` (single source of truth)
- Internal naming: `FieldKind` → `EFieldKind`, `CompiledField` → `ICompiledField`, `CompiledValidator` → `ICompiledValidator`
- `batchCreate()` with `concurrency > 1` falls back to sequential in browser (no error)

### Fixed
- Circular dependency between `schema-build.ts` and `batch-parallel.ts`
- Portuguese comments translated to English in `type-field.base.ts` and `schema-types.ts`
- Redundant `String()` wrapper in `batch-parallel.ts` worker result reconstruction

## [0.1.18] - 2026-03-26

### Added
- `TypeField.configure()` for optional validation level override
- `ToolObjectTransform` with `flatten()` and `unflatten()` methods
- `ToolCliParser`, `ToolFileDiscovery`, `ToolGit` generic tools
- `TypeGuard.extractBoolean()`, `extractArray()`, `extractNumber()`, `extractString()`, `isRecord()`, `isCallable()`
- Expose/redaction system: `toJSON(config, exposeLevel)` with `"public"`, `"private"`, `"redacted"` levels
- Lint CLI: `--init`, `--update`, `--uninstall` interactive setup
- Lint: `RuleRegistry`, `DisableCommentParser`, `IReporter`/`TextReporter`/`JsonReporter`
- Lint: hook managers (Husky, Lefthook, native git hooks)
- Next.js refactoring guide (`docs/guia-refatoracao-nextjs.md`)
- Documentation for tools, application layer, infrastructure, config

### Changed
- TypeField validation split into `validateType()` (static) + `validateRules()` (instance)
- `create<T>()` and `assign<T>()` now accept generic type for unknown input
- Removed `validateRaw()` — `create<unknown>()` replaces it
- Removed `normalize()` and `parseString()` from hot path
- Config decoupled from core lib — `TypeField` uses hardcoded defaults, no filesystem I/O on import
- Lint module restructured with OOP (Rule base class, RuleRegistry, Strategy pattern for reporters)
- `SchemaBuilder` reads validation levels from `TypeField.createLevel`/`TypeField.assignLevel`

### Fixed
- Nginx `port_in_redirect off` — prevents `:4200` in production redirects
- MDX parsing in type-guard.md — escaped comparison operators
- Prototype pollution guard in `ToolObjectTransform.unflatten()`
- JSON.parse wrapped in try-catch in all config loaders
- Sensitive TypeFields (FPassword, FBearer, FSignature, FPublicKeyPem) preserve whitespace

### Removed
- `validateRaw()` from all TypeFields
- `normalize()` from TypeField base
- `parseString()` from TypeField base
- Node.js tools from main barrel export (moved to direct imports)

## [0.1.10] - 2026-03-23

### Added
- Lint module with 10 rules (no-any, no-cast, no-non-null, no-ts-ignore, no-export-default, no-to-json-lowercase, no-new-type-field, no-magic-http-status, no-declare, no-satisfies-without-prefix)
- `batchCreate()` with optional worker thread parallelism
- `tyforge.config.json` global configuration
- `composeSchema()` for schema composition
- 15 canonical examples (01-15)
- Comprehensive test suite (246 tests)
- Benchmark suite (TyForge vs Zod) with Docker support

### Changed
- Package renamed from `@navegar-sistemas/tyforge` to `tyforge`
- DTOs split into `DtoReq` (request) and `DtoRes` (response)
- `IMapper` with `toDomainPaginated()` method
- `IRepositoryBase` with bulk operations and pagination

## [0.1.4] - 2026-03-20

### Added
- DDD checklist with 60 artifacts
- Complete test coverage for all examples
- Canonical naming conventions (F, T, I, O, Dto, DtoReq, DtoRes, Event, Exception, Repository, Mapper)

### Changed
- Schema builder hot path optimized
- Node.js engine bumped to >=24

## [0.1.0] - 2026-03-18

### Added
- TypeFields: FString, FEmail, FId, FInt, FBoolean, FJson, FDate (7 variants), FAppStatus, FHttpStatus, FBoolInt, FPageNumber, FPageSize, FBearer, FPassword, FApiKey, FPublicKeyPem, FSignature, FTraceId, FText, FDescription, FFullName, FIdReq
- SchemaBuilder with `compile()`, `create()`, `assign()` methods
- Result pattern: `ok()`, `err()`, `isSuccess()`, `isFailure()`, `map()`, `flatMap()`, `fold()`, `match()`, `all()`, `allSettled()`, `toPromise()`, `OK_TRUE`, `OK_FALSE`
- Domain models: Entity, ValueObject, Aggregate, DomainEvent, Dto
- Application: UseCase, IMapper, CQRS interfaces, Saga
- Infrastructure: IRepositoryBase, IRepositoryRead, Paginated, IUnitOfWork
- Exceptions: 18 types following RFC 7807
- Docusaurus documentation site
