# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Full history at [docs/CHANGELOG](docs/docs/guia/CHANGELOG.md).

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

