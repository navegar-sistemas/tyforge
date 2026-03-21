# TyForge - Documentacao Tecnica

Site de documentacao do TyForge da Navegar Sistemas, construido com [Docusaurus](https://docusaurus.io/).

## Inicio Rapido

### Pre-requisitos

- Node.js v18.0.0+
- npm v9.0.0+

### Instalacao e Execucao

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desenvolvimento (porta 4200)
npm run dev

# Build para producao
npm run build

# Servir build localmente
npm run serve
```

O site estara disponivel em: http://localhost:4200

## Docker

### Producao

```bash
docker compose -f docker-compose.yml up
```

### Desenvolvimento

```bash
# Copiar o arquivo de exemplo
cp docker-compose.override.example.yml docker-compose.override.yml

# Subir com hot reload
docker compose up
```

O override de desenvolvimento:
- Usa `Dockerfile.dev` com `docusaurus start --poll` (hot reload)
- Monta volumes locais (`docs/`, `src/`, `static/`, configs) para refletir alteracoes em tempo real
- Desabilita `read_only` e `healthcheck`
- Aumenta limites de CPU/memoria para suportar o webpack em modo dev

## Comandos

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para producao
npm run serve        # Serve build local
npm run clear        # Limpa cache
npm run typecheck    # Verificacao de tipos
```

---

**Navegar Sistemas** - TyForge Docs v1.0.0
