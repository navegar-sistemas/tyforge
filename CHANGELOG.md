# Changelog

Latest releases. Full history at [docs/CHANGELOG](docs/docs/CHANGELOG.md).

## [0.1.23] - 2026-03-27

### Added
- `applyMask()` shared utility for progressive document masking

### Fixed
- Portuguese error messages translated to English in `FInt`, `FPageNumber`, `FPageSize`
- `formatted()` return type aliases fixed in `FInt`, `FBoolean`, `FPageNumber`, `FPageSize`
- `applyMask` deduplicated — extracted from 3 document files to shared `TypeField.applyMask()`
- Documentation: corrected Portuguese accents across all Docusaurus pages

## [0.1.22] - 2026-03-27

### Added
- 35 new TypeFields: FMoney, FCurrency, FIdentifier, banking, documents, PIX, security, enums
- TypeField locale system: `TypeField.configure({ locale: "br" })`
- Subpath exports: `tyforge/result`, `tyforge/type-fields`, `tyforge/exceptions`, `tyforge/schema`, `tyforge/tools`
- Dynamic `import()` for batch-parallel — fixes Metro bundler crash

### Fixed
- Metro/React Native: `node:worker_threads` no longer loaded at top level
- `batchCreate()` fallback to sequential on browser/React Native

## [0.1.19] - 2026-03-27

### Added
- Browser field in package.json for Node.js/browser module substitution
- `IParallelProcessor`, `IBatchCreateResult`, `TAssignUnknown` types
- `createParallelProcessor()` factory function

### Changed
- Batch parallel: dependency injection eliminates circular dependency
- Internal naming: `EFieldKind`, `ICompiledField`, `ICompiledValidator`

### Fixed
- Circular dependency between `schema-build.ts` and `batch-parallel.ts`

## [0.1.18] - 2026-03-26

### Added
- `TypeField.configure()` for validation level override
- Expose/redaction system: `toJSON(config, exposeLevel)`
- Lint CLI with 10 rules and hook managers

### Changed
- TypeField validation split: `validateType()` + `validateRules()`
- Config decoupled from core lib — zero filesystem I/O on import

## [0.1.10] - 2026-03-23

### Added
- Lint module with 10 rules
- `batchCreate()` with worker thread parallelism
- 15 canonical examples, 246 tests

## [0.1.0] - 2026-03-18

### Added
- Initial release: TypeFields, SchemaBuilder, Result pattern, Domain models, Exceptions
