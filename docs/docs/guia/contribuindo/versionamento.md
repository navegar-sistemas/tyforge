---
title: Versionamento
sidebar_position: 8
---

# Versionamento

O TyForge segue o [Semantic Versioning (SemVer)](https://semver.org/) para todas as publicações no npm.

## Semver

O formato de versão segue o padrão `MAJOR.MINOR.PATCH`:

- **Major** (`X.0.0`) — breaking changes na API pública. Remoção de exports, mudanças de assinatura de métodos públicos, alteração de comportamento que quebra consumidores existentes.
- **Minor** (`0.X.0`) — adições retrocompatíveis. Novas features, mudanças arquiteturais internas, novas regras de lint, novos TypeFields, novos módulos complementares.
- **Patch** (`0.0.X`) — correções retrocompatíveis. Bug fixes, melhorias internas de performance, correções de documentação.

### Exemplos

| Mudança | Tipo |
|---------|------|
| Novo TypeField `FPhone` | Minor |
| Correção de validação em `FEmail` | Patch |
| Remoção de export público | Major |
| Nova regra de lint `no-magic-number` | Minor |
| Fix em mensagem de exceção | Patch |
| Novo módulo `@tyforge/graphql` | Minor |
| Alteração de assinatura de `SchemaBuilder.compile()` | Major |

## Pinagem de dependências

Todas as dependências em `dependencies` e `devDependencies` devem ser **pinadas** — versão exata, sem prefixo `^` ou `~`.

```json
{
  "dependencies": {
    "uuid": "11.1.0"
  },
  "devDependencies": {
    "typescript": "5.8.2"
  }
}
```

### Exceção: peerDependencies

`peerDependencies` usam range com `^` para permitir flexibilidade ao consumidor:

```json
{
  "peerDependencies": {
    "tyforge": "^0.2.0"
  }
}
```

### Justificativa

- **Reprodutibilidade** — builds idênticos em qualquer máquina, sem surpresas de versão
- **Segurança** — atualizações de dependências são intencionais e revisadas, nunca automáticas
- **Estabilidade** — elimina quebras causadas por minor/patch releases de terceiros

## Pre-commit

O hook de pre-commit inclui verificações automáticas de versionamento:

- **CheckVersions** — verifica que todas as dependências estão pinadas (sem `^` ou `~`). Rejeita commits que introduzam versões não pinadas.
- **npm audit** — executa auditoria de segurança e bloqueia commits quando vulnerabilidades conhecidas são detectadas.

Essas verificações rodam automaticamente a cada commit via Husky e não podem ser suprimidas.

## Pacotes complementares

O TyForge é organizado em pacotes independentes:

| Pacote | Descrição |
|--------|-----------|
| `tyforge` | Core — schemas, TypeFields, domain models, result |
| `@tyforge/http` | Cliente HTTP type-safe |
| `@tyforge/graphql` | Cliente GraphQL type-safe |

### Versionamento independente

Cada pacote tem seu próprio `package.json` e segue versionamento independente. O pacote core (`tyforge`) pode estar na versão `0.2.5` enquanto `@tyforge/http` está na `0.1.3`.

### peerDependencies com range

Pacotes complementares declaram o core como `peerDependency` com range:

```json
{
  "peerDependencies": {
    "tyforge": "^0.2.0"
  }
}
```

Isso permite que o consumidor use qualquer versão compatível do core.

## Regras

1. **Incrementar versão antes do CHANGELOG** — a versão no `package.json` deve ser atualizada antes de criar a entrada no CHANGELOG.
2. **Nunca publicar versão existente** — cada publicação no npm deve ter uma versão única. Tentar publicar uma versão que já existe resulta em erro.
3. **Nunca pular versões** — incrementar sequencialmente (0.2.3 para 0.2.4, nunca para 0.2.6).
4. **Tag git** — cada release deve ter uma tag git correspondente (ex: `v0.2.4`).
5. **CHANGELOG obrigatório** — toda versão publicada deve ter uma entrada no CHANGELOG descrevendo as mudanças.
