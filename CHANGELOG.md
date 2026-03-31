# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Full history at [docs/CHANGELOG](docs/docs/guia/CHANGELOG.md).

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



