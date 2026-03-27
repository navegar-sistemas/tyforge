# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
