# 🔐 Security Review — Padrão Sênior (Node.js / TypeScript)

> Revisão obrigatória de segurança antes de qualquer merge.
> Genérico e aplicável a qualquer sistema backend moderno.
> Baseado em OWASP ASVS 5.0 (350 requisitos), OWASP Top 10, OWASP API Security Top 10, CVEs Node.js 2024-2026 e incidentes supply chain 2025-2026.

---

## 🧠 Objetivo

Identificar **todas** as vulnerabilidades, incluindo:

- Execução arbitrária de código (RCE)
- Injeções (SQL, NoSQL, Command, Template, Header, LDAP, XPath, CRLF)
- Falhas de autenticação/autorização (BOLA, BFLA, IDOR)
- Exposição de dados sensíveis
- Prototype pollution
- ReDoS (Regular Expression Denial of Service)
- SSRF (Server-Side Request Forgery)
- Supply chain attacks (typosquatting, postinstall, lockfile bypass)
- Problemas de concorrência, race conditions e resource exhaustion
- Falhas de criptografia e gestão de secrets
- Problemas de serialização/desserialização
- Misconfiguration de infraestrutura

---

## ⚙️ Execução

Revisar:

- Código alterado (staged + unstaged)
- Todos os arquivos relacionados
- Configurações de runtime (scripts, loaders, workers, env vars)
- Infraestrutura (Docker, CI/CD, reverse proxy)
- Dependências (package.json, lock files, postinstall scripts)
- Configuração de CORS, headers, rate limiting

---

## 🚨 Classificação obrigatória

- ✅ Seguro
- ⚠️ Risco
- ❌ Vulnerabilidade (explorável)

Itens ⚠️ Risco e ❌ Vulnerabilidade — bloqueiam o merge automaticamente

---

# 1. Execução dinâmica de código (CRÍTICO — OWASP ASVS V1)

### Verificar uso de:

- [ ] `eval()`
- [ ] `new Function()`
- [ ] `setTimeout(string)` / `setInterval(string)`
- [ ] `Worker(..., { eval: true })`
- [ ] `vm.runInNewContext()` / `vm.runInThisContext()` / `vm.compileFunction()`
- [ ] `child_process.exec()` com interpolação de strings
- [ ] `child_process.execSync()` com interpolação
- [ ] `require()` com path dinâmico (variável, não string literal)
- [ ] `import()` dinâmico com path de input externo
- [ ] `Proxy` ou `Reflect` em objetos de input não-validado
- [ ] `with` statement (acesso a propriedades arbitrárias)

### Regras obrigatórias

- [ ] Código dinâmico é 100% estático
- [ ] Não há concatenação de strings para gerar código
- [ ] Não há uso de input externo em execução de código
- [ ] Não há interpolação insegura em shell commands
- [ ] `execFile()` com array de argumentos usado em vez de `exec()` com shell
- [ ] Template literals nunca usados para montar queries/commands com input
- [ ] `child_process.spawn()` com `{ shell: false }` quando possível

### Vulnerabilidades específicas

- [ ] Execução baseada em input do usuário
- [ ] Código vindo de banco/config externa sem sanitização
- [ ] Uso de eval para lógica de negócio
- [ ] Strings de código montadas por concatenação
- [ ] `Function.prototype.call/apply` com argumentos de input

---

# 2. Worker Threads e paralelismo (OWASP ASVS V1, V2)

- [ ] Workers não executam código dinâmico
- [ ] Não há recursão de bootstrap (worker criando worker indefinidamente)
- [ ] Comunicação entre threads validada (type guards em todas as mensagens)
- [ ] Formato das mensagens verificado antes de processar (schema/type check)
- [ ] Não há race conditions críticas em dados compartilhados
- [ ] `SharedArrayBuffer` usado com `Atomics` quando compartilhado
- [ ] Worker paths são estáticos (não derivados de input)
- [ ] Limite máximo de workers para prevenir resource exhaustion
- [ ] Workers terminados corretamente em caso de erro (`.terminate()`)
- [ ] Timeout configurado para operações de worker
- [ ] Dados transferidos entre threads são imutáveis ou clonados

---

# 3. Loaders, runtime e configuração do Node.js

- [ ] Uso de loaders é controlado e estático
- [ ] Não há loops de import circular que causem undefined
- [ ] Comportamento consistente entre ambientes (dev/prod/CI)
- [ ] Não há `--experimental-*` flags em produção sem justificativa documentada
- [ ] `NODE_OPTIONS` não permite injeção de código em produção
- [ ] `--enable-source-maps` desabilitado em produção (expõe paths internos)
- [ ] Permission model do Node.js 24+ usado quando aplicável (`--experimental-permission`)
- [ ] `process.env` não exposto diretamente ao cliente
- [ ] `NODE_DEBUG` desabilitado em produção
- [ ] Versão do Node.js atualizada com patches de segurança (CVE-2025-59465, CVE-2025-59466, CVE-2026-21636, CVE-2026-21637)

---

# 4. Validação de entrada (OWASP ASVS V1, V2 — OWASP API1-API3)

### Validação de formato

- [ ] Toda entrada externa validada via DTOs/schemas ANTES de processamento
- [ ] Não há uso direto de `req.body`, `req.params`, `req.query` sem validação
- [ ] Tipos verificados (string, number, boolean — não confia no Content-Type)
- [ ] Formato verificado (email, UUID, data, etc.)
- [ ] Tamanho verificado (min/max length para strings)
- [ ] Range verificado (min/max para números)
- [ ] Enum verificado contra values conhecidos
- [ ] Encoding explícito (UTF-8) — não depende de inferência

### Validação estrutural

- [ ] Arrays têm limite de tamanho (previne payload bombing)
- [ ] Objetos nested têm profundidade máxima
- [ ] Campos extras rejeitados (não silenciosamente ignorados se sensível)
- [ ] Content-Type verificado antes de processar body
- [ ] Request size limitado globalmente
- [ ] Multipart uploads validam tipo MIME real (não apenas extensão)
- [ ] Nomes de arquivo de upload gerados pelo servidor

### Validação de negócio

- [ ] IDs verificados contra escopo do usuário (anti-IDOR)
- [ ] Operações de bulk com limite de itens por request
- [ ] Idempotency keys validadas para operações não-idempotentes
- [ ] Rate limiting por endpoint E por usuário

---

# 5. Injeções (OWASP ASVS V1 — OWASP Top 10 A03)

### SQL/NoSQL Injection
- [ ] Queries parametrizadas (prepared statements) em toda interação
- [ ] Não há concatenação de strings para montar queries
- [ ] ORM/query builder usado corretamente (sem raw queries com input)
- [ ] Operadores MongoDB (`$gt`, `$ne`, `$regex`, `$where`, `$expr`) não aceitam input direto
- [ ] Prisma: `$queryRaw` e `$executeRaw` não usam template strings com input
- [ ] Busca full-text sanitizada

### Command Injection
- [ ] Não há `exec()` / `execSync()` com interpolação de variáveis
- [ ] `execFile()` com array de argumentos usado quando necessário
- [ ] Paths sanitizados antes de uso em comandos
- [ ] Não há backticks, `$()`, `;`, `&&`, `||`, `|`, `>`, `<` em strings de comando
- [ ] Variáveis de ambiente não controlam execution paths

### Template Injection (SSTI)
- [ ] Templates server-side não executam código dinâmico
- [ ] Não há interpolação de input do usuário em templates
- [ ] Auto-escaping ativado em todos os template engines
- [ ] Sandbox mode ativado quando disponível

### Header Injection / CRLF / Response Splitting
- [ ] Headers HTTP não contêm input do usuário sem sanitização
- [ ] `\r\n` removidos de valores antes de setar headers
- [ ] Redirect URLs validadas contra whitelist de domínios
- [ ] `Location` header não aceita URLs arbitrárias

### XPath / LDAP / XML Injection
- [ ] Queries XPath/LDAP parametrizadas
- [ ] Caracteres especiais escapados
- [ ] XML parsing com DTD desabilitado (previne XXE)
- [ ] `libxml` com `noent: false` e `dtdload: false`

---

# 6. Prototype Pollution (Node.js específico — CVEs recorrentes)

- [ ] `Object.assign()` não usado com dados de input externo direto
- [ ] Spread operator (`...`) não usado em objetos de input sem validação prévia
- [ ] `__proto__`, `constructor`, `prototype` filtrados de input JSON
- [ ] `Object.create(null)` usado para maps de dados dinâmicos
- [ ] Merge recursivo de objetos não aceita input não-validado
- [ ] `in` operator não usado em objetos de input (usar `Object.prototype.hasOwnProperty.call()`)
- [ ] Libraries de deep merge verificadas (lodash `merge` é vulnerável, usar `structuredClone` ou alternativa segura)
- [ ] JSON.parse output validado por schema antes de uso
- [ ] `Object.freeze()` aplicado em objetos de configuração
- [ ] `Map` usado em vez de objetos plain para key-value de input

---

# 7. ReDoS — Regular Expression Denial of Service

- [ ] Regex usadas em validação são lineares (sem backtracking exponencial)
- [ ] Não há regex com grupos aninhados repetidos: `(a+)+`, `(a|a)+`, `(a*)*`
- [ ] Não há regex com alternação dentro de repetição: `(a|b)*c`
- [ ] Regex de email, URL, path seguem padrões conhecidos e testados (HTML5 spec, RFC)
- [ ] Input tem limite de tamanho ANTES de ser testado contra regex
- [ ] `safe-regex` ou `recheck` usado para validar regex em tempo de build
- [ ] Timeout configurado para operações de regex em input longo
- [ ] Regex complexas movidas para WebAssembly (RE2) quando performance-critical

---

# 8. SSRF — Server-Side Request Forgery (OWASP API7, OWASP A10)

- [ ] URLs fornecidas pelo usuário validadas contra whitelist de domínios
- [ ] IPs privados/internos bloqueados:
  - `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
  - `169.254.0.0/16` (link-local)
  - `::1`, `fc00::/7` (IPv6 privado)
- [ ] DNS rebinding prevenido (resolver IP antes de fazer request, verificar IP resolvido)
- [ ] Redirects não seguidos automaticamente em requests para URLs de input
- [ ] Protocolos restritos (apenas `http://` e `https://` — sem `file://`, `gopher://`, `dict://`)
- [ ] Metadata de cloud bloqueado (`169.254.169.254` para AWS/GCP/Azure)
- [ ] Request timeout configurado (previne slow-SSRF)
- [ ] Response size limitado

---

# 9. Sistema de arquivos (OWASP ASVS V5)

- [ ] Paths validados com `path.resolve()` + verificação de escopo (must start with base dir)
- [ ] Sem path traversal (`../` removidos OU rejeitados — nunca apenas sanitizados)
- [ ] Acesso restrito ao diretório do projeto
- [ ] Uploads salvos fora do document root
- [ ] Nomes de arquivo gerados pelo servidor (UUID, hash — nunca nome original)
- [ ] Permissões de arquivo corretas (`0o644` para arquivos, `0o755` para diretórios — nunca `0o777`)
- [ ] Symlinks não seguidos em operações de leitura/escrita de input
- [ ] Temp files removidos após uso (`finally` block)
- [ ] File descriptors fechados corretamente (previne fd leak — CVE-2026-21637)
- [ ] Stat check + open não tem TOCTOU race condition (use `fs.open` com flags)

---

# 10. Dados sensíveis (OWASP ASVS V6, V8 — OWASP A02)

### Armazenamento
- [ ] Senhas hasheadas com bcrypt (cost >= 12) / scrypt / argon2id (nunca MD5/SHA1/SHA256 sem salt)
- [ ] Salt gerado por `crypto.randomBytes()` (nunca Math.random)
- [ ] PII (dados pessoais) encriptados em repouso (AES-256-GCM)
- [ ] Chaves de encriptação rotacionadas periodicamente
- [ ] Dados deletados com `crypto.timingSafeEqual` para comparação segura

### Exposição
- [ ] Sem logs de senhas, tokens, chaves de API, dados pessoais
- [ ] Stack traces não expostos ao cliente em produção
- [ ] Respostas de erro não revelam estrutura interna (table names, paths, queries)
- [ ] Headers de segurança configurados (ver seção 14)
- [ ] Campos sensíveis excluídos de `toJSON()` (password, hash, secret)
- [ ] Pagination não expõe total de registros quando sensível

### Secrets
- [ ] Secrets não hardcoded (usar env vars, vault, ou secret manager)
- [ ] `.env` no `.gitignore`
- [ ] Secrets diferentes por ambiente (dev/staging/prod)
- [ ] Secrets rotacionados periodicamente
- [ ] Secrets nunca em query strings (podem aparecer em logs de proxy)

---

# 11. Autenticação (OWASP ASVS V6 — OWASP A07, API2)

- [ ] Passwords com requisitos de complexidade (min 8 chars, verificar against breached passwords)
- [ ] Rate limiting em login (ex: 5 tentativas por minuto)
- [ ] Account lockout temporário após N tentativas (com notificação ao usuário)
- [ ] Timing-safe comparison para verificação de password/token
- [ ] JWT validado corretamente: assinatura, expiração (`exp`), issuer (`iss`), audience (`aud`)
- [ ] JWT `alg: none` rejeitado explicitamente
- [ ] JWT secret com entropia suficiente (min 256 bits)
- [ ] Refresh tokens com rotation e invalidação em uso
- [ ] Logout invalida token no servidor (blacklist ou short-lived + refresh)
- [ ] Multi-factor authentication disponível para operações sensíveis
- [ ] Session fixation prevenida (regenerar session ID após login)
- [ ] Password reset com token de uso único e expiração curta (< 1h)
- [ ] Não há enumeração de usuários (mensagens genéricas em login/reset)
- [ ] OAuth/OIDC: state parameter validado, PKCE usado para SPAs

---

# 12. Autorização (OWASP ASVS V8 — OWASP A01, API1, API3, API5)

- [ ] RBAC ou ABAC implementado consistentemente
- [ ] Permissões verificadas em TODA rota protegida (middleware, não apenas frontend)
- [ ] BOLA prevenido — user só acessa SEUS recursos (verificação object-level)
- [ ] BFLA prevenido — user não acessa funções de outro role (verificação function-level)
- [ ] BOPLA prevenido — user não modifica propriedades que não deveria (mass assignment)
- [ ] Privilege escalation prevenida (user não pode mudar próprio role)
- [ ] Admin endpoints isolados e com autenticação adicional
- [ ] API keys com escopo mínimo (least privilege)
- [ ] Vertical privilege escalation prevenida (user → admin)
- [ ] Horizontal privilege escalation prevenida (user A → dados de user B)
- [ ] Soft-deleted records não acessíveis via API
- [ ] Bulk operations verificam autorização por item (não apenas no batch)

---

# 13. Tipagem e validação runtime (TypeScript específico)

- [ ] Zero `any` em código de produção
- [ ] Zero `as` cast (exceto `as const`)
- [ ] Zero `!` non-null assertion
- [ ] Zero `@ts-ignore` / `@ts-expect-error`
- [ ] Input externo sempre tipado como `unknown` antes de validação
- [ ] Assertion functions usadas para narrowing (não casts)
- [ ] Generics com constraints (não `<T>` livre)
- [ ] Enums validados contra values conhecidos (não aceita qualquer string)
- [ ] `strict: true` no tsconfig
- [ ] `noUncheckedIndexedAccess: true` quando possível
- [ ] Discriminated unions para state machines (não string literals)

---

# 14. HTTP e API Security (OWASP ASVS V3, V4 — OWASP API4, API8)

### CORS
- [ ] CORS configurado com whitelist de origens (nunca `*` em produção)
- [ ] `Access-Control-Allow-Credentials` só com origens específicas
- [ ] Preflight cached com `Access-Control-Max-Age`

### Rate Limiting
- [ ] Rate limiting global (previne DDoS)
- [ ] Rate limiting por endpoint (endpoints sensíveis mais restritivos)
- [ ] Rate limiting por IP E por user/token
- [ ] Response headers indicam limite (`X-RateLimit-*`)

### Request/Response
- [ ] Request body size limitado (`body-parser` limit ou equivalente)
- [ ] Timeout configurado para todas as requests
- [ ] Compression habilitada (mas cuidado com BREACH attack em HTTPS)
- [ ] Paginated responses com limite de page size
- [ ] Não há mass assignment (campos whitelist, não blacklist)

### Headers de segurança
- [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `Content-Security-Policy` configurada
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` configurada (camera, geolocation, etc.)
- [ ] `X-Powered-By` removido (não revelar tecnologia)
- [ ] `Server` header removido ou genérico

### Cookies
- [ ] `HttpOnly` em todos os cookies com tokens
- [ ] `Secure` em todos os cookies (HTTPS only)
- [ ] `SameSite=Strict` ou `SameSite=Lax`
- [ ] `Path` restrito ao necessário
- [ ] Cookies não contêm dados sensíveis em plaintext

---

# 15. Dependências e Supply Chain (OWASP A06, A08 — incidentes 2025-2026)

### Gestão de dependências
- [ ] `npm audit` sem vulnerabilidades high/critical
- [ ] Lock file commitado e usado no CI (`npm ci`, não `npm install`)
- [ ] Dependências de produção pinadas com versão exata quando críticas
- [ ] Sem dependências abandonadas (último update > 2 anos)
- [ ] Número mínimo de dependências (menos deps = menor superfície de ataque)
- [ ] `npm outdated` revisado periodicamente

### Supply chain defense
- [ ] `postinstall` / `preinstall` / `prepare` scripts revisados em TODA nova dependência
- [ ] `ignore-scripts` habilitado globalmente (`npm config set ignore-scripts true`) com whitelist
- [ ] `--provenance` verificado para pacotes críticos
- [ ] Socket.dev, Snyk ou similar configurado para scan automático
- [ ] Typosquatting verificado (nome da dependência é o correto?)
- [ ] Maintainers do pacote verificados (não foram comprometidos?)
- [ ] Não há dependências de Git URLs sem hash pinado
- [ ] SBOM (Software Bill of Materials) gerado para compliance
- [ ] Dependência `chalk`, `debug` e similares verificadas (alvo do ataque Shai-Hulud 2025)
- [ ] GitHub Actions / CI runners isolados (não rodam postinstall de deps untrusted)

---

# 16. Logging e monitoramento (OWASP ASVS V10 — OWASP A09)

- [ ] Logging estruturado (JSON) com níveis (error, warn, info, debug)
- [ ] Logs NÃO contêm: passwords, tokens, API keys, PII, números de cartão
- [ ] Tentativas de autenticação logadas (sucesso E falha com IP/user-agent)
- [ ] Erros de autorização logados com contexto (quem tentou acessar o quê)
- [ ] Alterações em dados sensíveis logadas (audit trail imutável)
- [ ] Logs centralizados e monitorados (alertas em anomalias)
- [ ] Log rotation configurado (não encher disco)
- [ ] Timestamp em UTC com precisão de millisegundos
- [ ] Correlation ID em todas as requests (rastreabilidade)
- [ ] Logs não vulneráveis a log injection (`\n` e ANSI codes sanitizados)
- [ ] Alert configurado para: N falhas de login, privilege escalation attempts, rate limit hits

---

# 17. Criptografia (OWASP ASVS V9)

- [ ] TLS 1.2+ obrigatório (sem SSL, sem TLS 1.0/1.1)
- [ ] TLS 1.3 preferido quando suportado
- [ ] Certificados válidos e renovados automaticamente (Let's Encrypt ou similar)
- [ ] Cipher suites seguras (sem RC4, DES, 3DES, export ciphers)
- [ ] Chaves privadas protegidas e não commitadas
- [ ] Dados sensíveis encriptados em repouso (AES-256-GCM, não AES-ECB)
- [ ] Hashing: bcrypt/argon2id para passwords, SHA-256+ para integridade
- [ ] Sem uso de `Math.random()` para valores criptográficos (usar `crypto.randomBytes()`)
- [ ] IVs e nonces não reutilizados (gerados aleatoriamente por operação)
- [ ] Key derivation com PBKDF2/scrypt/argon2 (não hash direto)
- [ ] Certificado pinning quando comunicando com APIs internas

---

# 18. Docker e infraestrutura (OWASP ASVS V12)

- [ ] Imagem base mínima (alpine, distroless, slim)
- [ ] Não roda como root no container (`USER node` ou similar)
- [ ] `read_only: true` quando possível
- [ ] `no-new-privileges: true`
- [ ] Secrets via environment runtime ou vault (nunca no Dockerfile/build args)
- [ ] Health check configurado
- [ ] Recursos limitados (CPU, memória, PIDs)
- [ ] Network isolada (sem `host` mode em produção)
- [ ] Não há `privileged: true`
- [ ] Imagens escaneadas (Trivy, Snyk Container, Docker Scout)
- [ ] Multi-stage build (build deps não estão na imagem final)
- [ ] `.dockerignore` configurado (sem `.env`, `.git`, `node_modules`)
- [ ] Base image pinada por digest (não apenas tag)
- [ ] Não há bind mounts de diretórios sensíveis do host

---

# 19. CI/CD e deploy

- [ ] Secrets não expostos em logs de CI (masked)
- [ ] Branch protection habilitada (main/master)
- [ ] PRs requerem review de pelo menos 1 pessoa
- [ ] Testes automatizados no pipeline (unit + integration)
- [ ] Scan de vulnerabilidades no pipeline (`npm audit`, Snyk, Socket)
- [ ] Lint de segurança no pipeline (tyforge-lint ou equivalente)
- [ ] SAST (Static Application Security Testing) configurado
- [ ] Deploy automatizado sem intervenção manual
- [ ] Rollback automatizado em caso de falha (health check + auto-revert)
- [ ] Não há credenciais em código ou configuração versionada
- [ ] Artifacts assinados (provenance)
- [ ] Pipeline não executa scripts de dependências untrusted
- [ ] Environments isolados (dev não acessa prod, staging não acessa prod DB)

---

# 20. Denial of Service — DoS (OWASP API4)

- [ ] Rate limiting implementado em todos os endpoints
- [ ] Payload size limitado (body, headers, query string)
- [ ] Timeout em todas as operações assíncronas (DB, HTTP, workers)
- [ ] Limite de conexões simultâneas
- [ ] Limite de batch size (arrays, bulk operations)
- [ ] Worker/thread pool com limite máximo
- [ ] Regex validadas contra ReDoS (seção 7)
- [ ] Não há loops infinitos possíveis via input
- [ ] Graceful shutdown implementado (SIGTERM → drain connections → close)
- [ ] Backpressure em streams (producer não sobrecarrega consumer)
- [ ] HTTP/2: max concurrent streams limitado (CVE-2025-59465)
- [ ] WebSocket: max message size e connection limit
- [ ] Não há amplification attacks (response >> request)
- [ ] Healthcheck endpoint leve (não faz queries pesadas)

---

# 21. Serialização e desserialização (OWASP A08)

- [ ] `JSON.parse()` com try/catch (input malformado não crasha)
- [ ] Não há desserialização de objetos arbitrários (`eval`, YAML `!!python`, pickle)
- [ ] Protobuf/MessagePack com schema definido (não aceita estrutura arbitrária)
- [ ] Dados de worker threads validados antes de processar (type guards)
- [ ] Não há `JSON.parse()` em dados > 10MB sem streaming
- [ ] Content-Type verificado antes de parsear body
- [ ] XML parsing com DTD desabilitado (previne XXE — XML External Entity)
- [ ] `JSON.stringify()` com replacer para excluir campos sensíveis
- [ ] Circular references detectadas antes de serializar

---

# 22. Business Logic (OWASP API6)

- [ ] Fluxos de negócio críticos têm rate limiting específico (ex: checkout, transfer)
- [ ] Operações financeiras são idempotentes (retry não duplica)
- [ ] Concorrência tratada (optimistic locking ou pessimistic locking)
- [ ] Estado de recursos verificado antes de transições (state machine)
- [ ] Não há bypass de fluxo (ex: pular etapa de pagamento)
- [ ] Limites de negócio aplicados server-side (não apenas frontend)
- [ ] Ações destrutivas requerem confirmação (double-submit, re-auth)
- [ ] Audit trail para todas as operações de negócio sensíveis

---

# 23. Third-party APIs e integrações (OWASP API10)

- [ ] APIs consumidas tratadas como untrusted (validar responses)
- [ ] Timeout configurado para chamadas externas
- [ ] Circuit breaker implementado (evita cascade failure)
- [ ] Retry com exponential backoff (não sobrecarrega serviço externo)
- [ ] Credentials de APIs externas rotacionadas
- [ ] Webhooks recebidos validados (signature verification)
- [ ] Não há trust implícito em dados de terceiros
- [ ] Fallback definido para quando API externa falha

---

# 24. Inventory e documentação (OWASP API9)

- [ ] Todas as APIs documentadas (sem shadow APIs)
- [ ] Versões antigas descomissionadas
- [ ] Endpoints de debug/test removidos em produção
- [ ] Swagger/OpenAPI não exposto em produção (ou protegido)
- [ ] `/health`, `/metrics`, `/debug` protegidos ou restritos
- [ ] Não há endpoints esquecidos (varredura de rotas)

---

# 🚫 Critérios de reprovação automática

- Execução dinâmica insegura (eval, Function, exec com interpolação)
- RCE possível por qualquer vetor
- Input não validado usado em queries, commands, templates ou file paths
- SQL/NoSQL/Command/Template/Header injection
- Exposição de dados sensíveis (passwords, tokens, PII em logs, responses ou errors)
- Prototype pollution via input externo
- SSRF para redes internas ou metadata de cloud
- Path traversal com leitura/escrita fora do escopo
- Dependência com vulnerabilidade crítica conhecida
- Secrets hardcoded em código
- Autenticação/autorização bypassável (BOLA, BFLA, IDOR, privilege escalation)
- ReDoS em regex de validação
- Supply chain: dependência com postinstall malicioso não revisado
- Missing rate limiting em endpoints críticos
- JWT com alg:none aceito
- XML parsing com DTD habilitado (XXE)
- Worker threads processando mensagens não validadas

---

# 🎯 Objetivo final

Sistema seguro, previsível e pronto para produção.
Zero vulnerabilidades exploráveis. Zero riscos aceitos.

---

## Referências

- [OWASP ASVS 5.0](https://github.com/OWASP/ASVS) — Application Security Verification Standard (350 requisitos, 17 capítulos)
- [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)
- [OWASP Node.js Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- [Node.js Security Best Practices](https://nodejs.org/en/learn/getting-started/security-best-practices)
- [Node.js January 2026 Security Release](https://nodejs.org/en/blog/vulnerability/december-2025-security-releases)
- [npm Supply Chain Attack 2025 (Shai-Hulud)](https://snyk.io/articles/npm-security-best-practices-shai-hulud-attack/)
- [npm Supply Chain Defense Guide 2026](https://bastion.tech/blog/npm-supply-chain-attacks-2026-saas-security-guide)
- [OWASP API Security Testing Checklist 2026](https://accuknox.com/blog/owasp-api-security-top-10-the-complete-testing-checklist-2026)
- [awesome-nodejs-security](https://github.com/lirantal/awesome-nodejs-security)
