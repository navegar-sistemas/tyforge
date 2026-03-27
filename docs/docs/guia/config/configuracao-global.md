---
title: Configuração Global
sidebar_position: 1
---

# Configuração Global

O TyForge suporta configuração global via arquivo `tyforge.config.json` na raiz do projeto. A configuração controla o nível de validação dos schemas e dos TypeFields.

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

## Seção `schema`

### `schema.validate.create`

Nível de validação usado pelo modo `create` do `SchemaBuilder`. O modo `create` é usado para validar dados de entrada novos (ex: input de formulários, APIs).

### `schema.validate.assign`

Nível de validação usado pelo modo `assign` do `SchemaBuilder`. O modo `assign` é usado para hidratar dados já persistidos (ex: registros do banco de dados).

### Níveis de validação (`TValidationLevel`)

| Nível | Descrição |
|-------|-----------|
| `"full"` | Validação completa: tipo + faixa/comprimento + enum. Padrão para `create` |
| `"type"` | Apenas verificação de tipo (sem validação de faixa, comprimento ou enum). Padrão para `assign` |
| `"none"` | Nenhuma validação. O valor é aceito sem verificação |

A separação entre `create` e `assign` existe porque:

- **create** recebe dados de fontes externas não confiáveis (usuário, API) — validação completa é necessária
- **assign** recebe dados já validados anteriormente e persistidos no banco — verificação de tipo é suficiente para garantir integridade sem custo de validação completa

## Comportamento do `loadTyForgeConfig()`

A função `loadTyForgeConfig()` é usada apenas pelo CLI do linter (`tyforge-lint`) para carregar configurações. Ela **não** é importada nem chamada pela biblioteca core (TypeFields, SchemaBuilder, etc).

Seu comportamento:

1. **Arquivo encontrado e válido** — carrega e valida todas as chaves
2. **Arquivo não encontrado** — usa os valores padrão silenciosamente
3. **Arquivo com JSON inválido** — lança erro com mensagem `"<path>: invalid JSON"`
4. **Arquivo com chave desconhecida** — lança erro com mensagem `"<path>: unknown config key "<key>""`

### Valores padrão

Se o arquivo `tyforge.config.json` não existir, os seguintes valores padrão são aplicados:

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

### Chaves permitidas no nível raiz

Apenas duas chaves são permitidas no nível raiz:

| Chave | Tipo | Descrição |
|-------|------|-----------|
| `schema` | `object` | Configuração de validação do SchemaBuilder |
| `lint` | `object` | Configuração do linter (opcional, veja seção abaixo) |

Qualquer outra chave gera um erro de configuração.

## TypeField.createLevel e TypeField.assignLevel

A classe base `TypeField` expõe duas propriedades estáticas públicas com valores padrão hardcoded:

```typescript
abstract class TypeField<TPrimitive, TFormatted> {
  static createLevel: TValidationLevel = "full";
  static assignLevel: TValidationLevel = "type";
  // ...
}
```

Essas propriedades são usadas internamente pelos TypeFields concretos ao chamar `validateRules()` nos métodos `create()` e `assign()`.

**Importante:** a classe `TypeField` **não** importa `tyforgeConfig` nem lê o arquivo `tyforge.config.json`. Os níveis de validação são definidos com valores padrão hardcoded e podem ser alterados programaticamente via `TypeField.configure()`.

## Método `TypeField.configure()`

Permite alterar níveis de validação e locales em tempo de execução:

```typescript
static configure(options: {
  create?: TValidationLevel;
  assign?: TValidationLevel;
  localeDisplay?: TLocaleDisplay;
  localeRules?: TLocaleRules;
}): void;
```

Exemplo de uso no bootstrap da aplicação:

```typescript
import { TypeField } from "tyforge";

// Desabilita validação no assign para maximizar performance
TypeField.configure({ create: "full", assign: "none" });

// Configura locale brasileiro (formatação + regras de validação)
TypeField.configure({ localeDisplay: "br", localeRules: "br" });
```

- `localeDisplay` — controla formatação (`formatted()`, `formatNumber()`). Valores: `"us"` | `"br"`
- `localeRules` — controla regras de validação de negócio. Valores: `"us"` | `"br"`

A integração entre o arquivo `tyforge.config.json` e o `TypeField.configure()` fica a cargo do projeto consumidor. O CLI do linter (`tyforge-lint`) lê o arquivo de configuração, mas a biblioteca core não faz isso automaticamente.

## Seção `lint`

A seção `lint` dentro do `tyforge.config.json` configura o linter. Alternativamente, o linter pode ser configurado via um arquivo dedicado `tyforge-lint.config.json`.

A ordem de prioridade para configuração do linter:

1. Flag `--config <path>` na linha de comando
2. Arquivo `tyforge-lint.config.json` na raiz do projeto
3. Seção `lint` dentro de `tyforge.config.json`
4. Valores padrão

Para detalhes completos sobre a configuração do linter, consulte a [documentação do Linter](/contribuindo/lint).

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

### Projeto com validação relaxada no assign

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

Neste cenário, dados vindos do banco de dados não passam por nenhuma validação no `assign`, maximizando a performance em cenários de leitura intensiva.

### Projeto em desenvolvimento com validação completa

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

Neste cenário, tanto `create` quanto `assign` validam completamente, útil para detectar inconsistências nos dados persistidos durante o desenvolvimento.
