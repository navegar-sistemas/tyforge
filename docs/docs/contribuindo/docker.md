---
title: Docker
sidebar_position: 4
---

# Docker

O site de documentação roda em Docker com Docusaurus.

## Produção

```bash
cd docs
docker compose -f docker-compose.yml up
```

Serve o site estático na porta **4200** com limites de recursos, filesystem read-only, healthcheck e logging configurados.

## Desenvolvimento

```bash
cd docs

# Copiar o arquivo de exemplo
cp docker-compose.override.example.yml docker-compose.override.yml

# Subir com hot reload
docker compose up
```

O override de desenvolvimento:

| Config | Produção | Desenvolvimento |
|--------|----------|-----------------|
| Dockerfile | `Dockerfile` (build estático + serve) | `Dockerfile.dev` (docusaurus start --poll) |
| Filesystem | `read_only: true` | `read_only: false` |
| Memória | 256M | 2G |
| CPU | 1 | 2 |
| PIDs | 100 | 200 |
| Healthcheck | wget a cada 30s | desabilitado |
| Hot reload | não | sim (volumes montados) |

O webpack do Docusaurus em dev consome mais memória e processos que o `serve` estático de produção — por isso os limites são maiores no override.

## Volumes montados (dev)

```yaml
volumes:
  - ./docs:/app/docs        # Conteúdo markdown
  - ./src:/app/src          # Componentes React
  - ./static:/app/static    # Arquivos estáticos
  - ./docusaurus.config.js  # Config principal
  - ./sidebars.ts           # Navegação
```

Editar qualquer arquivo montado dispara recompilação automática (~600ms).
