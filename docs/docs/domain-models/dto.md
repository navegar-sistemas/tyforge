---
title: Dto
sidebar_position: 5
slug: /domain-models/dto
---

# Dto

Um **Dto** (Data Transfer Object) e um Value Object especializado para transporte de dados em contextos HTTP. Possui campos pre-definidos para status, body, headers, query parameters e path parameters.

## Assinatura

```typescript
abstract class Dto<
  TProps extends TDtoPropsBase,
  TPropsJson extends TDtoPropsJson,
> extends ValueObject<TProps, TPropsJson> {
  public constructor();
}
```

## Interfaces base

### `TDtoPropsBase`

Define a estrutura das propriedades internas do Dto, usando TypeFields:

```typescript
export interface TDtoPropsBase {
  status?: FHttpStatus;
  body?: unknown;
  headers?: Record<string, TypeField<unknown>>;
  query?: Record<string, TypeField<unknown>>;
  params?: Record<string, TypeField<unknown>>;
  [key: string]: unknown;
}
```

### `TDtoPropsJson`

Define a estrutura da representacao JSON (primitivos):

```typescript
export interface TDtoPropsJson {
  status?: THttpStatus;
  body?: unknown;
  headers?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}
```

## Campos pre-definidos

| Campo | Tipo (Props) | Tipo (JSON) | Descricao |
|-------|-------------|-------------|-----------|
| `status?` | `FHttpStatus` | `THttpStatus` (number) | Codigo HTTP da resposta |
| `body?` | `unknown` | `unknown` | Corpo da requisicao/resposta |
| `headers?` | `Record<string, TypeField>` | `Record<string, unknown>` | Headers HTTP tipados |
| `query?` | `Record<string, TypeField>` | `Record<string, unknown>` | Query parameters tipados |
| `params?` | `Record<string, TypeField>` | `Record<string, unknown>` | Path parameters tipados |

Todos os campos sao opcionais. A interface aceita propriedades adicionais via index signature (`[key: string]: unknown`).

## Exemplo

```typescript
import { Dto, TDtoPropsBase, TDtoPropsJson, FHttpStatus, FString, FId } from "@navegar-sistemas/tyforge";

// 1. Defina os tipos
interface ICriarUsuarioDtoProps extends TDtoPropsBase {
  body: {
    nome: FString;
    email: FString;
  };
  params: {
    tenantId: FId;
  };
}

interface ICriarUsuarioDtoJson extends TDtoPropsJson {
  body: {
    nome: string;
    email: string;
  };
  params: {
    tenantId: string;
  };
}

// 2. Implemente o Dto
class CriarUsuarioDto extends Dto<ICriarUsuarioDtoProps, ICriarUsuarioDtoJson> {
  protected readonly _classInfo = {
    name: "CriarUsuarioDto",
    version: "1.0.0",
    description: "DTO para criacao de usuario",
  };

  body: { nome: FString; email: FString };
  params: { tenantId: FId };

  private constructor(props: ICriarUsuarioDtoProps) {
    super();
    this.body = props.body;
    this.params = props.params;
  }

  static create(props: ICriarUsuarioDtoProps): CriarUsuarioDto {
    return new CriarUsuarioDto(props);
  }
}

// 3. Use o Dto
const dto = CriarUsuarioDto.create({
  body: {
    nome: FString.createOrThrow("Maria Silva"),
    email: FString.createOrThrow("maria@email.com"),
  },
  params: {
    tenantId: FId.generate(),
  },
});

// Serializar — TypeFields sao desembrulhados automaticamente
const json = dto.toJson();
// {
//   body: { nome: "Maria Silva", email: "maria@email.com" },
//   params: { tenantId: "uuid-aqui" }
// }
```

## Comparacao

Por herdar de `ValueObject`, o Dto utiliza comparacao estrutural via `JSON.stringify`:

```typescript
dto1.equals(dto2); // true se todos os campos forem identicos
```

## Relacao com Schema Builder

Dtos podem ser combinados com o `SchemaBuilder` para validar dados de entrada e construir o Dto de forma segura:

```typescript
import { SchemaBuilder, FString, FEmail } from '@navegar-sistemas/tyforge';
import type { ISchemaInlineObject } from '@navegar-sistemas/tyforge';

const schema = {
  nome:  { type: FString, required: true },
  email: { type: FEmail, required: true },
} satisfies ISchemaInlineObject;

const validator = SchemaBuilder.compile(schema);
const result = validator.create(requestBody);
// Result com TypeFields validados, prontos para construir o Dto
```
