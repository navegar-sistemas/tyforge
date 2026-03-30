---
title: Migrações
sidebar_position: 0
---

# Guias de Migração

Guias passo a passo para migrar projetos existentes para os padrões TyForge.

Cada guia cobre a adoção incremental do framework — desde a instalação até a reestruturação completa da camada de domínio seguindo Clean Architecture, SOLID e DDD.

## Guias disponíveis

| Framework/Stack | Status |
|----------------|--------|
| [Next.js](./nextjs) | Disponível |
| NestJS | Em breve |
| Express | Em breve |
| Fastify | Em breve |
| React (frontend) | Em breve |
| Angular | Em breve |

## Estrutura dos guias

Cada guia segue a mesma estrutura:

1. **Pré-requisitos** — versões mínimas, dependências
2. **Instalação** — como adicionar TyForge ao projeto
3. **Adoção incremental** — começar por TypeFields e Result, depois SchemaBuilder, depois Domain Models
4. **Reestruturação de camadas** — aplicar separação domain/application/infrastructure
5. **Exemplos práticos** — antes vs depois com código real
