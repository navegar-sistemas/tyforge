# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Full history at [docs/CHANGELOG](docs/docs/guia/CHANGELOG.md).

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



