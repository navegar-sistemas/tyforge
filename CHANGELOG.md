# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Full history at [docs/CHANGELOG](docs/docs/guia/CHANGELOG.md).

## [0.2.18] - 2026-03-31

### Changed
- Regra de versionamento por branch — versões e CHANGELOGs só são alterados na main
- `peerDependencies` e `devDependencies` atualizados para `tyforge@0.2.18`

## [0.2.17] - 2026-03-31

### Added
- `FPassword.getStrength(value)`: método estático que retorna `IPasswordStrength` com resultado individual de cada regra (length, uppercase, lowercase, digit, special) — permite indicador de força de senha em UI
- `FPassword.isWeak(value)`: método estático que detecta senhas previsíveis (caracteres repetidos, dígitos sequenciais, padrões de teclado como qwerty/azerty)
- `IPasswordStrength`: interface exportada com os 5 campos booleanos de força

### Changed
- `FPassword.validateRules()`: usa `getStrength()` internamente e rejeita senhas detectadas por `isWeak()` com `ExceptionValidation` descritiva
- Prettier integrado ao projeto (printWidth: 80, `.prettierrc.json`, `.editorconfig`)
- Nova regra guard `max-line-length` (80 colunas)
- Novo pre-commit check `CheckFormat` (prettier --check)
- `@tyforge/graphql` (`0.2.2`), `@tyforge/http` (`0.1.13`), `@tyforge/websocket` (`0.1.13`), `@tyforge/guard` (`0.1.8`): bump de versão para publicação
- `peerDependencies` e `devDependencies` atualizados para `tyforge@0.2.17`

## [0.2.16] - 2026-03-31

### Fixed
- `isInternalDep`: lógica corrigida — `startsWith("tyforge")` dava falso positivo em pacotes externos como `tyforge-xyz`; substituído por match exato `tyforge` + prefix `@tyforge/`
- `RANGE_REGEX`: removida segunda alternativa `[\s-]\d` que flagrava pre-releases numéricos (`1.0.0-1`) como versão não pinada
- `IInternalDep.section`: campo removido — era coletado mas nunca lido (dead code)
- CHANGELOG: adicionada entry retroativa para `0.2.14` (publicada no npm sem entry)
- CHANGELOG: acentos corrigidos na entry `0.2.14`

### Changed
- `@tyforge/graphql` (`0.2.1`), `@tyforge/http` (`0.1.12`), `@tyforge/websocket` (`0.1.12`), `@tyforge/guard` (`0.1.7`): bump de versão para publicação
- `peerDependencies` e `devDependencies` atualizados para `tyforge@0.2.16`

## [0.2.15] - 2026-03-31

### Changed
- `peerDependencies` e `devDependencies` atualizados para `tyforge@0.2.15`

## [0.2.14] - 2026-03-31

### Changed
- `CheckPublishReady`: validação expandida para todos os pacotes internos do monorepo — verifica consistência de versão e pinagem de qualquer dependência `tyforge` ou `@tyforge/*` entre pacotes (antes verificava apenas `tyforge` core)
- `CheckPublishReady`: removido `as` cast no catch — usa `extractError()` da classe base
- `peerDependencies` e `devDependencies` atualizados para `tyforge@0.2.14`

## [0.2.13] - 2026-03-31

### Changed
- `@tyforge/graphql` (`0.2.0`): transport layer migrado para `graphql-request` (v7.4.0) — substitui implementação manual com fetch
- `@tyforge/graphql` (`0.2.0`): `DtoGraphQLRequest.variables` alterado de `Record<string, FString>` para `FJson` — corrige double-serialization de variáveis complexas
- `@tyforge/graphql` (`0.2.0`): null-data guard — retorna `invalidResponse` quando `data` é `null`/`undefined` sem erros GraphQL
- `@tyforge/graphql` (`0.2.0`): HTTP 5xx em `ClientError` mapeado para `networkError` (antes era `invalidResponse`)
- `@tyforge/graphql` (`0.2.0`): erro GraphQL `IGraphQLError` mapeado via `.map()` em vez de type predicate — compatível com `GraphQLError` do pacote `graphql`
- Pre-commit: `CheckPublishReady` movido para posição 3 (após typecheck e tests, antes de lint)
- `@tyforge/http` (`0.1.11`), `@tyforge/websocket` (`0.1.11`), `@tyforge/guard` (`0.1.6`): bump de versão para publicação
- `peerDependencies` e `devDependencies` atualizados para `tyforge@0.2.13`

### Fixed
- `@tyforge/graphql`: double-serialization de variáveis — objetos complexos eram stringificados duas vezes via `Record<string, FString>` + `unwrapStringMap()`

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



