---
title: Docker
sidebar_position: 4
---

# Docker

O site de documentação roda em Docker com Docusaurus. Dois Dockerfiles cobrem produção e desenvolvimento.

## Produção

```bash
cd docs
docker compose -f docker-compose.yml up
```

O `Dockerfile` usa **multi-stage build** para gerar uma imagem mínima com Nginx:

### Stage 1: Build

- **Imagem base**: `node:24.14.1-alpine`
- Instala dependências sem devDependencies: `npm ci --omit=dev`
- Executa `npm run build` para gerar os estáticos do Docusaurus
- Executa `node generate-csp.js` para gerar hashes CSP dos inline scripts (detalhado abaixo)
- Remove `node_modules` para não poluir a imagem final
- **Verificação de segurança**: um `grep` confirma que `script-src` não contém mais `unsafe-inline`. Se o `generate-csp.js` falhar em substituir, o build aborta com erro

### Stage 2: Serve

- **Imagem base**: `nginx:1.28.3-alpine`
- Copia os estáticos do stage anterior para `/usr/share/nginx/html`
- Copia o `nginx.conf` gerado (com hashes CSP) para `/etc/nginx/conf.d/default.conf`
- **Smoke test**: `nginx -t` (valida configuração) + verifica que `index.html` existe
- Roda como `USER nginx` (não root)
- Porta **4200**

## Desenvolvimento

```bash
cd docs

# Copiar o arquivo de exemplo
cp docker-compose.override.example.yml docker-compose.override.yml

# Subir com hot reload
docker compose up
```

O `Dockerfile.dev` usa **single stage**:

- **Imagem base**: `node:24.14.1-alpine`
- Instala todas as dependências (incluindo devDependencies)
- Roda como `USER node` (não root)
- Inicia o Docusaurus com `--host 0.0.0.0 --poll 1000` para hot reload dentro do container
- Porta **4200**

## Tabela de comparação

| Config | Produção | Desenvolvimento |
|--------|----------|-----------------|
| Dockerfile | `Dockerfile` (multi-stage: build + Nginx) | `Dockerfile.dev` (single stage: Docusaurus start) |
| Usuário | `USER nginx` | `USER node` |
| Filesystem | `read_only: true` | `read_only: false` |
| Memória | 256M | 2G |
| CPU | 1 | 2 |
| PIDs | 100 | 200 |
| Healthcheck | wget a cada 30s | desabilitado |
| Hot reload | não | sim (volumes montados) |
| HSTS | sim (Nginx header) | não (Docusaurus dev server) |
| gzip | sim (Nginx) | não (Docusaurus dev server) |
| CSP hashes | sim (gerados no build) | não |

O webpack do Docusaurus em dev consome mais memória e processos que o `serve` estático de produção — por isso os limites são maiores no override.

## Segurança Docker

### Execução sem root

Ambos os containers rodam como usuário não-root:

- **Produção**: `USER nginx` — o Nginx Alpine já inclui este usuário
- **Desenvolvimento**: `USER node` — o Node.js Alpine já inclui este usuário

Nenhum processo roda como `root` em runtime.

### Versões pinadas

Todas as imagens base usam versões exatas sem `latest`, `^` ou `~`:

- `node:24.14.1-alpine` (build e dev)
- `nginx:1.28.3-alpine` (produção)

### Filesystem read-only (produção)

O `docker-compose.yml` define `read_only: true` no container de produção. O Nginx precisa de diretórios temporários para funcionar, então são montados via `tmpfs`:

```yaml
read_only: true
tmpfs:
  - /tmp:size=32M
  - /var/cache/nginx:size=16M
  - /var/run:size=1M
```

### Restrições de segurança adicionais

```yaml
security_opt:
  - no-new-privileges:true
deploy:
  resources:
    limits:
      cpus: "1"
      memory: 256M
      pids: 100
```

- `no-new-privileges`: impede escalação de privilégios via `setuid`/`setgid`
- **Limites de recursos**: CPU, memória e PIDs limitados para evitar abuso do host
- **Logging controlado**: `json-file` com rotação de 5MB e 3 arquivos no máximo

## Nginx

### Security headers

O `nginx.conf` define headers de segurança no nível do `server` block:

| Header | Valor | Propósito |
|--------|-------|-----------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | HSTS: força HTTPS por 2 anos |
| `X-Content-Type-Options` | `nosniff` | Previne MIME sniffing |
| `X-Frame-Options` | `DENY` | Bloqueia inclusão em iframes |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limita informação do referer |
| `Permissions-Policy` | `camera=(), geolocation=(), ...` | Desabilita APIs sensíveis do browser |
| `Content-Security-Policy` | `script-src 'self' <hashes>; ...` | Controla origens de scripts e estilos |

Adicionalmente:

- `server_tokens off` — oculta a versão do Nginx nas respostas
- `port_in_redirect off` — evita que redirecionamentos internos incluam `:4200` na URL

### Headers repetidos em location blocks

O Nginx tem um comportamento importante: quando um `location` block define qualquer `add_header`, **todos** os headers do nível `server` são descartados para aquele location. Por isso, os security headers são repetidos em cada location block que define headers próprios:

```nginx
# server level: define todos os security headers

location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    # Security headers REPETIDOS aqui (obrigatório)
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    # ... demais headers
}
```

Sem essa repetição, o location `/assets/` teria apenas `Cache-Control` e nenhum security header.

### gzip

Compressão habilitada para tipos textuais:

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript
           text/xml application/xml text/javascript image/svg+xml;
gzip_min_length 256;
gzip_vary on;
```

O `gzip_min_length 256` evita comprimir respostas muito pequenas onde o overhead do gzip não compensa. O `gzip_vary on` adiciona `Vary: Accept-Encoding` para que proxies mantenham caches corretos.

## Geração de hashes CSP

O arquivo `generate-csp.js` roda automaticamente durante o build Docker (após `npm run build`).

### Problema

O Docusaurus gera inline scripts nos arquivos HTML (ex: hidratação React, dados de rota). A diretiva `unsafe-inline` no `script-src` do CSP permitiria qualquer inline script, incluindo injeções maliciosas.

### Solução

O `generate-csp.js` resolve isso em 3 passos:

1. **Extrai** todos os inline scripts dos HTMLs gerados no diretório `build/`
2. **Calcula** o SHA-256 de cada script encontrado
3. **Substitui** `'unsafe-inline'` no `script-src` do `nginx.conf` pelos hashes exatos (ex: `'sha256-abc123...'`)

Após a substituição, apenas os scripts com hash exato conhecido são permitidos. Qualquer script injetado por atacante seria bloqueado pelo browser.

### Verificação no Dockerfile

O Dockerfile inclui uma verificação pós-execução:

```dockerfile
RUN ! grep -q "script-src[^;]*unsafe-inline" /app/nginx.conf \
    || (echo "ERROR: generate-csp.js failed to replace unsafe-inline in script-src" && exit 1)
```

Se por qualquer motivo o `generate-csp.js` não conseguir substituir o `unsafe-inline`, o build falha. Isso garante que nenhuma imagem de produção seja gerada com `unsafe-inline` no `script-src`.

### Monitoramento via pre-commit

O pre-commit hook do projeto verifica se o Docusaurus ainda gera inline scripts. Se uma atualização do Docusaurus parar de gerar inline scripts, o `generate-csp.js` não encontrará hashes e o `nginx.conf` ficará sem `unsafe-inline` e sem hashes — o que pode quebrar funcionalidades. O pre-commit detecta essa situação.

## Volumes montados (dev)

```yaml
volumes:
  - .:/app
```

O override de desenvolvimento monta todo o diretório `docs/` no container. Editar qualquer arquivo dispara recompilação automática (~600ms). Os diretórios mais comuns editados durante o desenvolvimento:

| Caminho | Conteúdo |
|---------|----------|
| `docs/` | Conteúdo markdown das páginas |
| `src/` | Componentes React customizados |
| `static/` | Arquivos estáticos (imagens, fontes) |
| `docusaurus.config.js` | Configuração principal do Docusaurus |
| `sidebars.ts` | Configuração de navegação lateral |
