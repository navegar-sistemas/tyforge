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

A funcao `loadTyForgeConfig()` e usada apenas pelo CLI do linter (`tyforge-lint`) para carregar configuracoes. Ela **nao** e importada nem chamada pela biblioteca core (TypeFields, SchemaBuilder, etc).

Seu comportamento:

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

A classe base `TypeField` expoe duas propriedades estaticas publicas com valores padrao hardcoded:

```typescript
abstract class TypeField<TPrimitive, TFormatted> {
  static createLevel: TValidationLevel = "full";
  static assignLevel: TValidationLevel = "type";
  // ...
}
```

Essas propriedades sao usadas internamente pelos TypeFields concretos ao chamar `validateRules()` nos metodos `create()` e `assign()`.

**Importante:** a classe `TypeField` **nao** importa `tyforgeConfig` nem le o arquivo `tyforge.config.json`. Os niveis de validacao sao definidos com valores padrao hardcoded e podem ser alterados programaticamente via `TypeField.configure()`.

## Metodo `TypeField.configure()`

Permite alterar os niveis de validacao em tempo de execucao:

```typescript
static configure(levels: { create?: TValidationLevel; assign?: TValidationLevel }): void;
```

Exemplo de uso no bootstrap da aplicacao:

```typescript
import { TypeField } from "tyforge";

// Desabilita validacao no assign para maximizar performance
TypeField.configure({ create: "full", assign: "none" });
```

A integracao entre o arquivo `tyforge.config.json` e o `TypeField.configure()` fica a cargo do projeto consumidor. O CLI do linter (`tyforge-lint`) le o arquivo de configuracao, mas a biblioteca core nao faz isso automaticamente.

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
