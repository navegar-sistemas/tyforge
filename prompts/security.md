# CLAUDE.md — Security Audit & Hardening com TyForge

Template de prompt para projetos que utilizam TyForge com foco em segurança. Copie este arquivo para a raiz do projeto e ajuste conforme necessário.

## Postura de Segurança

TyForge implementa defense-in-depth: validação em múltiplas camadas, sanitização de input, limites de recursos e proteção contra ataques comuns. Segurança é prioridade absoluta sobre qualquer outra decisão técnica.

## Ordem de Prioridade para Decisões

1. **Segurança** — sempre prioridade máxima, sem exceção
2. **Performance (diferença significativa)** — quando o impacto é mensurável
3. **SOLID / Clean Code / Clean Architecture** — nesta ordem
4. **Performance (diferença insignificante)** — micro-otimizações como desempate

## Camadas de Proteção

### 1. TypeFields — Validação na Fronteira

Toda entrada de dados externa passa por TypeFields antes de entrar no domínio. TypeFields são Value Objects imutáveis com validação estrita.

**TypeFields de segurança disponíveis:**

| TypeField | Validação | Uso |
|-----------|-----------|-----|
| `FPassword` | 8-128 chars, uppercase + lowercase + dígito + especial, unicode aceito (NIST SP 800-63B) | Senhas de usuário |
| `FBearer` | Prefixo `Bearer `, 100-5000 chars | Tokens de autenticação |
| `FApiKey` | UUID v4 exato (36 chars), `toSafeDisplay()` para logs | Chaves de API |
| `FSignature` | Base64, 64-512 chars | Assinaturas digitais |
| `FTotpSecret` | Base32 (RFC 4648), 16-128 chars | Secrets TOTP/2FA |
| `FTotpCode` | Exatamente 6 dígitos numéricos | Códigos TOTP/2FA |
| `FPublicKeyPem` | PEM com BEGIN/END markers, base64 válido, 100-1000 chars | Chaves públicas ECDSA P-521 |
| `FCertificateThumbprint` | Hex, 40 chars (SHA-1) ou 64 chars (SHA-256) | Thumbprints de certificado |
| `FHashAlgorithm` | Enum: ECDSA_P256_SHA256, ECDSA_P384_SHA384, Ed25519, RSA_PKCS1_SHA256, RSA_PSS_SHA256 | Algoritmos de hash |
| `FUrlOrigin` | HTTPS obrigatório (exceto localhost), bloqueia IPs privados | Endpoints de API |
| `FEmail` | RFC 5322, domínio válido | E-mails |
| `FDocumentCpf` | Validação de dígitos verificadores | CPF |

**Regras:**
- Nunca aceitar primitivos (`string`, `number`) em boundaries de API — sempre TypeField
- Nunca fazer `JSON.parse()` sem validar com DTO/Schema do TyForge
- Nunca contornar validação com `as` cast ou `!` non-null assertion
- `FPassword`, `FBearer`, `FSignature`, `FPublicKeyPem` preservam whitespace (sem trim) para dados sensíveis

### 2. Schema Expose/Redaction — Controle de Visibilidade

Campos sensíveis nunca vazam acidentalmente em respostas de API:

```typescript
const userSchema = {
  name:     { type: FString },                        // public — sempre visível
  email:    { type: FEmail, expose: "private" },       // private — omitido em respostas públicas
  password: { type: FPassword, expose: "redacted" },   // redacted — omitido em tudo exceto debug interno
} satisfies ISchema;
```

**Níveis de visibilidade:**

| Nível | `toJSON()` | `toJSON(cfg, "private")` | `toJSON(cfg, "redacted")` |
|-------|-----------|------------------------|--------------------------|
| `public` (default) | Visível | Visível | Visível |
| `"private"` | `[REDACTED]` | Visível | Visível |
| `"redacted"` | `[REDACTED]` | `[REDACTED]` | Visível |

**Regras:**
- Senhas, tokens, secrets, chaves privadas: sempre `expose: "redacted"`
- E-mails, telefones, documentos: `expose: "private"`
- Redação via schema, nunca via override de `toJSON()` no TypeField
- Logs e error handlers devem usar `toJSON()` sem exposeLevel (default public)
- Respostas de API autenticadas podem usar `"private"` — nunca `"redacted"`
- Debug interno (dev only) pode usar `"redacted"` — nunca em produção

### 3. Services — Proteção de Rede

Os services (`ServiceHttp`, `ServiceGraphQL`, `ServiceWebSocket`) implementam proteções automáticas:

#### SSRF Protection

```
FUrlOrigin → HTTPS enforcement → DNS resolution → Private IP blocking → Request
```

- `FUrlOrigin` rejeita HTTP em produção (exceto localhost/127.0.0.1 para dev)
- `ToolNetworkSecurity.resolveAndValidate()` resolve DNS e valida IP contra ranges privados
- `validateEndpointDns()` chamado antes de cada request nos 3 services
- IPs bloqueados: RFC 1918 (10/8, 172.16/12, 192.168/16), link-local (169.254/16, fe80::/10), loopback (127/8, ::1), CGNAT (100.64/10), unique local IPv6 (fc00::/7, fd::/8)
- IPv4-mapped IPv6 (::ffff:10.0.0.1) detectado e re-validado contra ranges IPv4

**Nota React Native:** `validateEndpointDns()` retorna `true` por default (requer `node:dns`). Em apps mobile, SSRF é responsabilidade do backend.

#### Header Injection Protection

`ToolHeaderSecurity.sanitizeHeaders()` aplicado em todos os services:

- Remove CRLF (`\r\n`) e null bytes (`\0`) de keys e values
- Bloqueia keys de prototype pollution: `__proto__`, `constructor`, `prototype`
- Aplicado automaticamente — nunca bypassar

#### Redirect Protection

- HTTP e GraphQL usam `redirect: "error"` no fetch
- Rejeita todos os redirects automaticamente — previne open redirect
- `TypeError` com "redirect" mapeado para `ExceptionHttp.unsafeEndpoint()`

#### Response Size Limits

- HTTP: `MAX_RESPONSE_BYTES = 10485760` (10 MB)
- WebSocket: `MAX_MESSAGE_BYTES = 10485760` (10 MB)
- Verificado antes de parsing — previne memory exhaustion e decompression bombs
- HTTP verifica `content-length` header E tamanho real do body

#### Timeout Protection

- Todos os services: `MAX_TIMEOUT_MS = 300000` (5 minutos)
- `AbortController` com `setTimeout` para enforcement
- Timeout é configurável via DTO: `{ timeout: 30000 }`
- Sem timeout default (consumidor define) — considerar adicionar default para evitar requests eternos

#### Content-Type Validation (HTTP)

- Response com `application/json` → `JSON.parse()`
- Qualquer outro content-type → trata como text
- Request: `application/json;charset=UTF-8` ou `application/x-www-form-urlencoded;charset=UTF-8`

### 4. GraphQL — Proteções Específicas

#### Introspection Blocking

```typescript
// Regex: /\b(__schema|__type)\b/
ServiceGraphQLSecurity.isIntrospectionQuery(query)
```

- Detecta `__schema` e `__type` como word boundaries
- Bloqueia antes de enviar ao servidor — zero network call
- Retorna `ExceptionGraphQL.unsafeQuery()`
- Previne schema enumeration attacks

#### Variable Sanitization

```typescript
ServiceGraphQLSecurity.sanitizeVariables(vars)
```

- Remove `__proto__`, `constructor`, `prototype` recursivamente
- `MAX_SANITIZE_DEPTH = 50` — previne stack overflow com objetos profundos
- Retorna `err()` se profundidade exceder limite
- Aplicado automaticamente antes de enviar variables ao servidor

#### GraphQL Error Mapping

- `UNAUTHENTICATED` detectado via `extensions.code` E `message`
- Erros GraphQL mapeados para `ExceptionGraphQL` com operationType (query/mutation)
- HTTP 5xx → `networkError` (servidor fora, proxy error)
- HTTP 4xx sem GraphQL errors → `invalidResponse`
- Data null sem errors → `invalidResponse`

### 5. WebSocket — Proteções Específicas

#### Reconnection com Backoff e Jitter

```
delay = baseDelay * 2^(attempt-1) * jitter
jitter = 0.5 + Math.random() * 0.5
```

- `BASE_RECONNECT_DELAY_MS = 1000`
- `MAX_RECONNECT_DELAY_MS = 30000`
- Jitter previne thundering herd (50-100% do delay base)
- Tentativas configuráveis via `maxReconnectAttempts`

#### Message Sanitization

- `MAX_SANITIZE_DEPTH = 50` para mensagens recebidas
- Prototype pollution keys removidos recursivamente
- Mensagens que excedem `MAX_MESSAGE_BYTES` silenciosamente descartadas

### 6. Prototype Pollution — Defesa em Profundidade

Proteção aplicada em 4 camadas independentes:

| Camada | Implementação | Keys Bloqueadas |
|--------|---------------|-----------------|
| `ToolObjectTransform` | `flatten()` / `unflatten()` | `__proto__`, `constructor`, `prototype` |
| `ToolHeaderSecurity` | `sanitizeHeaders()` | `__proto__`, `constructor`, `prototype` |
| `ServiceGraphQLSecurity` | `sanitizeVariables()` | `__proto__`, `constructor`, `prototype` |
| `ServiceWebSocketSecurity` | `sanitizeMessage()` | `__proto__`, `constructor`, `prototype` |

Cada camada opera independentemente — falha em uma não compromete as outras.

### 7. Configuration Security

`loadTyForgeConfig()` valida o path do arquivo de configuração:

- Bloqueia null bytes: `/\0/`
- Bloqueia URLs absolutas: `/^(?:[a-z]+:)?\/\//i`
- Bloqueia path traversal: `/(?:^|[\/\\])\.\.(?:[\/\\]|$)/`
- Whitelist de nomes: apenas `tyforge.config.json` e `tyforge-lint.config.json`
- Validação de real path com `fs.realpathSync()` — previne symlink attacks
- Limite de tamanho: `MAX_CONFIG_SIZE = 1048576` (1 MB)
- `JSON.parse()` envolto em try-catch

### 8. Docker Sandbox

Para execução segura de código em sandbox:

```yaml
# docker-compose.sandbox.yml
deploy:
  resources:
    limits:
      cpus: "4"
      memory: 4G
      pids: 256
    reservations:
      memory: 512M

security_opt:
  - no-new-privileges:true

cap_drop:
  - ALL

tmpfs:
  - /tmp:size=512M
```

- **User isolation**: container roda como user não-root `sandbox`
- **Resource limits**: CPU, memória, PIDs limitados
- **No privilege escalation**: `no-new-privileges:true`
- **Capabilities dropped**: `cap_drop: ALL` — princípio do menor privilégio
- **Filesystem**: `/tmp` montado como tmpfs com limite de 512 MB
- **Network**: bridge mode para isolamento

## Pre-commit Security Checks

O pre-commit executa verificações de segurança automaticamente:

| Check | Tipo | O que verifica |
|-------|------|---------------|
| `CheckTypecheck` | Blocking | Erros de tipo — previne runtime errors |
| `CheckTests` | Blocking | Testes unitários — garante comportamento esperado |
| `CheckPublishReady` | Blocking | Versões não duplicadas no npm — previne publish acidental |
| `CheckLint` | Blocking | Violações de padrão — inclui regras de segurança |
| `CheckDockerBuild` | Blocking | Docker build funcional — sandbox íntegro |
| `CheckDeprecated` | Blocking | Dependências deprecated — possíveis vulnerabilidades |
| `CheckVersions` | Confirmable | Versões desatualizadas — warns interativos |

**Adicionalmente:**
- `npm audit` deve ser executado regularmente
- Dependências sempre pinadas (versão exata, sem `^`, `~`, `*`)
- Pre-commit rejeita commits com vulnerabilidades conhecidas

## Proibições de Segurança

- Zero `any` — elimina bypass de type checking
- Zero `as` cast — elimina escape de validação
- Zero `!` non-null assertion — força null checking explícito
- Zero `@ts-ignore` / `@ts-expect-error` — erros de tipo devem ser corrigidos
- Zero `fetch()` direto — usar Services do TyForge com proteções embutidas
- Zero `JSON.parse()` sem schema — usar DTOs com `SchemaBuilder.compile()`
- Zero `typeof` manual — usar `TypeGuard` para narrowing seguro
- Zero HTTP em produção — `FUrlOrigin` garante HTTPS
- Zero IPs privados como endpoint — `ToolNetworkSecurity` bloqueia
- Zero headers sem sanitização — `ToolHeaderSecurity` obrigatório
- Zero secrets hardcoded — usar variáveis de ambiente
- Zero `console.log` com dados sensíveis — usar expose/redaction system
- Zero `AsyncStorage`/`localStorage` para tokens — usar secure storage
- Zero `eval()`, `new Function()`, `innerHTML` — injection vectors
- Zero `dangerouslySetInnerHTML` sem sanitização prévia

## Checklist de Security Review

Antes de aprovar qualquer PR:

### Input Validation
- [ ] Todos os inputs externos passam por TypeFields
- [ ] Nenhum primitivo plain em boundaries de API
- [ ] Schemas com `expose` correto para campos sensíveis
- [ ] Variables GraphQL sanitizadas (automático via Service)
- [ ] Headers sanitizados (automático via Service)

### Network Security
- [ ] Endpoints usam HTTPS (`FUrlOrigin`)
- [ ] DNS validation habilitada no backend (`validateEndpointDns()`)
- [ ] Redirects bloqueados (`redirect: "error"`)
- [ ] Response size limitada (10 MB default)
- [ ] Timeouts configurados em todas as requests
- [ ] Introspection GraphQL bloqueada

### Data Protection
- [ ] Senhas/tokens com `expose: "redacted"` no schema
- [ ] PII com `expose: "private"` no schema
- [ ] Logs usam `toJSON()` sem exposeLevel (redação automática)
- [ ] Nenhum dado sensível em URLs/query strings
- [ ] Nenhum dado sensível em error messages voltadas ao usuário

### Authentication
- [ ] Tokens em secure storage (nunca AsyncStorage/localStorage)
- [ ] Token refresh com rotação
- [ ] `getAuthHeaders()` implementado corretamente nos Services
- [ ] Logout limpa todos os stores e caches

### Infrastructure
- [ ] Dependências pinadas (versão exata)
- [ ] `npm audit` sem vulnerabilidades críticas/high
- [ ] Docker sandbox com resource limits e `no-new-privileges`
- [ ] Pre-commit hooks habilitados
- [ ] Config files validados (path traversal, symlink)

## Padrão de Implementação — Service Seguro

```typescript
import { ServiceHttp } from "@tyforge/http";
import { FUrlOrigin, FString } from "tyforge";
import { ok, isFailure } from "tyforge/result";
import type { Result } from "tyforge/result";
import type { Exceptions } from "tyforge/exceptions";

class ApiPagamentos extends ServiceHttp {
  protected readonly _classInfo = { name: "ApiPagamentos", version: "1.0.0", description: "API de pagamentos" };
  readonly endpoint = FUrlOrigin.createOrThrow("https://api.pagamentos.com");

  // Auth headers recuperados de secure storage, nunca hardcoded
  protected async getAuthHeaders(): Promise<Result<Record<string, FString>, Exceptions>> {
    const token = await secureStore.get("auth_token");
    if (!token) return ok({});
    return ok({ "Authorization": FString.createOrThrow(`Bearer ${token}`) });
  }

  // Override para habilitar DNS validation no backend (Node.js)
  protected override async validateEndpointDns(): Promise<boolean> {
    const { ToolNetworkSecurity } = await import("tyforge/tools/network-security");
    const hostname = new URL(this.endpoint.getValue()).hostname;
    const result = await ToolNetworkSecurity.resolveAndValidate(hostname);
    return result.valid;
  }

  async criarPagamento(dto: DtoReqCriarPagamento) {
    // DTO já validado por SchemaBuilder — input seguro
    // ServiceHttp aplica: header sanitization, SSRF check, redirect block, response limit, timeout
    return this.post(dto);
  }
}
```

## Vulnerabilidades Conhecidas e Mitigações

| Vulnerabilidade | Vetor | Mitigação TyForge |
|----------------|-------|-------------------|
| SSRF | Request para IP privado | `FUrlOrigin` + `ToolNetworkSecurity` + `validateEndpointDns()` |
| DNS Rebinding | DNS resolve para IP privado após validação | DNS resolution + IP validation no mesmo step |
| Prototype Pollution | `__proto__` em JSON/headers/variables | 4 camadas independentes de sanitização |
| Header Injection | CRLF em headers | `ToolHeaderSecurity` strip CRLF + null bytes |
| Schema Enumeration | GraphQL introspection | `isIntrospectionQuery()` com regex word boundary |
| Open Redirect | HTTP redirect para site malicioso | `redirect: "error"` em todos os services |
| Memory Exhaustion | Response gigante | `MAX_RESPONSE_BYTES` (10 MB) verificado antes de parsing |
| Decompression Bomb | Response comprimida que expande | Size check no body real, não só no header |
| Stack Overflow | Objeto JSON profundamente aninhado | `MAX_SANITIZE_DEPTH = 50` em sanitização recursiva |
| Path Traversal | Config file com `../` | Regex + real path validation + whitelist |
| Symlink Attack | Config file como symlink | `fs.realpathSync()` antes de ler |
| Thundering Herd | Reconexão simultânea de muitos clientes | Exponential backoff com jitter (50-100%) |
| Privilege Escalation | Container com root | User não-root + `no-new-privileges` + `cap_drop: ALL` |
