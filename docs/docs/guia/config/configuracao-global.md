---
title: Configuracao Global
sidebar_position: 1
---

# Configuracao Global

O TyForge suporta configuracao global via arquivo `tyforge.config.json` na raiz do projeto. A configuracao controla o nivel de validacao dos schemas e dos TypeFields.

## Estrutura do arquivo

```json
{
  "schema": {
    "validate": {
      "create": "full",
      "assign": "type"
    }
  },
  "lint": {
    "root": "src",
    "strict": true,
    "rules": {
      "no-any": "error",
      "no-cast": "error",
      "no-magic-http-status": "warning"
    }
  }
}
```

## Secao `schema`

### `schema.validate.create`

Nivel de validacao usado pelo modo `create` do `SchemaBuilder`. O modo `create` e usado para validar dados de entrada novos (ex: input de formularios, APIs).

### `schema.validate.assign`

Nivel de validacao usado pelo modo `assign` do `SchemaBuilder`. O modo `assign` e usado para hidratar dados ja persistidos (ex: registros do banco de dados).

### Niveis de validacao (`TValidationLevel`)

| Nivel | Descricao |
|-------|-----------|
| `"full"` | Validacao completa: tipo + faixa/comprimento + enum. Padrao para `create` |
| `"type"` | Apenas verificacao de tipo (sem validacao de faixa, comprimento ou enum). Padrao para `assign` |
| `"none"` | Nenhuma validacao. O valor e aceito sem verificacao |

A separacao entre `create` e `assign` existe porque:

- **create** recebe dados de fontes externas nao confiaveis (usuario, API) — validacao completa e necessaria
- **assign** recebe dados ja validados anteriormente e persistidos no banco — verificacao de tipo e suficiente para garantir integridade sem custo de validacao completa

## Comportamento do `loadTyForgeConfig()`

A funcao `loadTyForgeConfig()` e chamada automaticamente na inicializacao da biblioteca. Seu comportamento:

1. **Arquivo encontrado e valido** — carrega e valida todas as chaves
2. **Arquivo nao encontrado** — usa os valores padrao silenciosamente
3. **Arquivo com JSON invalido** — lanca erro com mensagem `"<path>: invalid JSON"`
4. **Arquivo com chave desconhecida** — lanca erro com mensagem `"<path>: unknown config key "<key>""`

### Valores padrao

Se o arquivo `tyforge.config.json` nao existir, os seguintes valores padrao sao aplicados:

```json
{
  "schema": {
    "validate": {
      "create": "full",
      "assign": "type"
    }
  }
}
```

### Chaves permitidas no nivel raiz

Apenas duas chaves sao permitidas no nivel raiz:

| Chave | Tipo | Descricao |
|-------|------|-----------|
| `schema` | `object` | Configuracao de validacao do SchemaBuilder |
| `lint` | `object` | Configuracao do linter (opcional, veja secao abaixo) |

Qualquer outra chave gera um erro de configuracao.

## TypeField.createLevel e TypeField.assignLevel

A classe base `TypeField` expoe duas propriedades estaticas protegidas que refletem a configuracao global:

```typescript
abstract class TypeField<TPrimitive, TFormatted> {
  protected static readonly createLevel = tyforgeConfig.schema.validate.create;
  protected static readonly assignLevel = tyforgeConfig.schema.validate.assign;
  // ...
}
```

Essas propriedades sao usadas internamente pelo `SchemaBuilder` ao chamar `create()` ou `assign()` nos TypeFields. Os TypeFields concretos podem consultar esses niveis para ajustar seu comportamento de validacao.

## Metodo normalize

A classe base `TypeField` possui um metodo estatico `normalize` que prepara o valor antes da validacao:

```typescript
protected static normalize(raw: unknown, validateLevel?: TValidationLevel, trim?: boolean): unknown
```

| Parametro | Padrao | Descricao |
|-----------|--------|-----------|
| `raw` | — | Valor bruto a ser normalizado |
| `validateLevel` | `"full"` | Nivel de validacao. Se `"none"`, retorna o valor sem modificacao |
| `trim` | `true` | Se deve aplicar `trim()` em strings |

Quando `validateLevel` e `"none"`, o `normalize` retorna o valor sem nenhuma transformacao. Caso contrario, strings sao trimadas por padrao. TypeFields sensiveis (como `FPassword`, `FBearer`, `FSignature`) usam `trim = false` para preservar espacos significativos.

## Secao `lint`

A secao `lint` dentro do `tyforge.config.json` configura o linter. Alternativamente, o linter pode ser configurado via um arquivo dedicado `tyforge-lint.config.json`.

A ordem de prioridade para configuracao do linter:

1. Flag `--config <path>` na linha de comando
2. Arquivo `tyforge-lint.config.json` na raiz do projeto
3. Secao `lint` dentro de `tyforge.config.json`
4. Valores padrao

Para detalhes completos sobre a configuracao do linter, consulte a [documentacao do Linter](/contribuindo/lint).

## Interface ITyForgeConfig

```typescript
interface ITyForgeConfig {
  schema: {
    validate: {
      create: TValidationLevel;
      assign: TValidationLevel;
    };
  };
  lint?: Record<string, unknown>;
}
```

## Exemplo de uso

### Projeto com validacao relaxada no assign

```json
{
  "schema": {
    "validate": {
      "create": "full",
      "assign": "none"
    }
  }
}
```

Neste cenario, dados vindos do banco de dados nao passam por nenhuma validacao no `assign`, maximizando a performance em cenarios de leitura intensiva.

### Projeto em desenvolvimento com validacao completa

```json
{
  "schema": {
    "validate": {
      "create": "full",
      "assign": "full"
    }
  }
}
```

Neste cenario, tanto `create` quanto `assign` validam completamente, util para detectar inconsistencias nos dados persistidos durante o desenvolvimento.
