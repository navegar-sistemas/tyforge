---
title: Docker
sidebar_position: 4
---

# Docker

O site de documentacao roda em Docker com Docusaurus.

## Producao

```bash
cd docs
docker compose -f docker-compose.yml up
```

Serve o site estatico na porta **4200** com limites de recursos, filesystem read-only, healthcheck e logging configurados.

## Desenvolvimento

```bash
cd docs

# Copiar o arquivo de exemplo
cp docker-compose.override.example.yml docker-compose.override.yml

# Subir com hot reload
docker compose up
```

O override de desenvolvimento:

| Config | Producao | Desenvolvimento |
|--------|----------|-----------------|
| Dockerfile | `Dockerfile` (build estatico + serve) | `Dockerfile.dev` (docusaurus start --poll) |
| Filesystem | `read_only: true` | `read_only: false` |
| Memoria | 256M | 2G |
| CPU | 1 | 2 |
| PIDs | 100 | 200 |
| Healthcheck | wget a cada 30s | desabilitado |
| Hot reload | nao | sim (volumes montados) |

O webpack do Docusaurus em dev consome mais memoria e processos que o `serve` estatico de producao — por isso os limites sao maiores no override.

## Volumes montados (dev)

```yaml
volumes:
  - ./docs:/app/docs        # Conteudo markdown
  - ./src:/app/src          # Componentes React
  - ./static:/app/static    # Arquivos estaticos
  - ./docusaurus.config.js  # Config principal
  - ./sidebars.ts           # Navegacao
```

Editar qualquer arquivo montado dispara recompilacao automatica (~600ms).
