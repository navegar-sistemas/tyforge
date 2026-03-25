---
title: Mapper
sidebar_position: 2
---

# Mapper

O `IMapper` e a interface que define a conversao bidirecional entre domain models e representacoes de persistencia. Cada mapper possui responsabilidade unica: converter um unico tipo de agregado.

## Interface

```typescript
import type { Aggregate } from "tyforge";
import type { IEntityProps } from "tyforge";
import type { Result, Exceptions, Paginated } from "tyforge";

interface IMapper<
  TAggregate extends Aggregate<IEntityProps>,
  TPersistence,
> {
  toDomain(raw: TPersistence): Result<TAggregate, Exceptions>;
  toDomainMany(raw: TPersistence[]): Result<TAggregate[], Exceptions>;
  toPersistence(domain: TAggregate): Result<TPersistence, Exceptions>;
  toPersistenceMany(domains: TAggregate[]): Result<TPersistence[], Exceptions>;
  toDomainPaginated(raw: Paginated<TPersistence>): Result<Paginated<TAggregate>, Exceptions>;
}
```

## Metodos

| Metodo | Entrada | Saida | Descricao |
|--------|---------|-------|-----------|
| `toDomain` | `TPersistence` | `Result<TAggregate>` | Converte um registro de persistencia para domain model |
| `toDomainMany` | `TPersistence[]` | `Result<TAggregate[]>` | Converte multiplos registros para domain models |
| `toPersistence` | `TAggregate` | `Result<TPersistence>` | Converte um domain model para formato de persistencia |
| `toPersistenceMany` | `TAggregate[]` | `Result<TPersistence[]>` | Converte multiplos domain models para persistencia |
| `toDomainPaginated` | `Paginated<TPersistence>` | `Result<Paginated<TAggregate>>` | Converte uma pagina inteira de registros para domain models |

Todos os metodos retornam `Result`, garantindo que erros de conversao (dados corrompidos no banco, campos faltando) sao tratados explicitamente sem lancar excecoes.

## Convencao de nomenclatura

Mappers seguem o prefixo `Mapper` seguido do nome do agregado:

| Mapper | Agregado |
|--------|----------|
| `MapperUser` | `User` |
| `MapperOrder` | `Order` |
| `MapperProduct` | `Product` |

## Exemplo completo

```typescript
import {
  isFailure, isSuccess, ok, all,
  Paginated, Result, Exceptions,
} from "tyforge";
import type { IMapper } from "tyforge";
import { User } from "./user.aggregate";
import type { TUserJson } from "./user.aggregate";

class MapperUser implements IMapper<User, TUserJson> {
  toDomain(raw: TUserJson): Result<User, Exceptions> {
    return User.assign(raw);
  }

  toDomainMany(raw: TUserJson[]): Result<User[], Exceptions> {
    return all(raw.map(r => this.toDomain(r)));
  }

  toPersistence(domain: User): Result<TUserJson, Exceptions> {
    return ok(domain.toJSON());
  }

  toPersistenceMany(domains: User[]): Result<TUserJson[], Exceptions> {
    return all(domains.map(d => this.toPersistence(d)));
  }

  toDomainPaginated(raw: Paginated<TUserJson>): Result<Paginated<User>, Exceptions> {
    const result = this.toDomainMany(raw.items);
    if (isFailure(result)) return result;
    return ok(new Paginated(result.value, raw.total, raw.page, raw.pageSize));
  }
}
```

## toDomain vs toDomainMany

O `toDomainMany` usa o combinador `all()` do Result pattern. Se qualquer item falhar na conversao, o resultado inteiro e uma falha com o primeiro erro encontrado. Isso garante que uma lista de registros e completamente valida ou completamente rejeitada.

```typescript
toDomainMany(raw: TUserJson[]): Result<User[], Exceptions> {
  return all(raw.map(r => this.toDomain(r)));
}
```

## toDomainPaginated

O `toDomainPaginated` recebe um `Paginated<TPersistence>` e preserva os metadados de paginacao (total, page, pageSize) enquanto converte apenas os itens:

```typescript
toDomainPaginated(raw: Paginated<TUserJson>): Result<Paginated<User>, Exceptions> {
  const result = this.toDomainMany(raw.items);
  if (isFailure(result)) return result;
  return ok(new Paginated(result.value, raw.total, raw.page, raw.pageSize));
}
```

## DtoRes — quem monta a resposta

O mapper nao e responsavel por montar respostas de API. Essa responsabilidade e do `DtoRes`, montado pelo controller ou use case:

```typescript
class DtoResUserProfile extends DtoRes<TProps, TJson> {
  static fromDomain(domain: User): Result<DtoResUserProfile, Exceptions> {
    const result = userProfileValidator.create({
      id: domain.id?.getValue() ?? "",
      fullName: domain.name.getValue(),
      email: domain.email.getValue(),
      isAdult: domain.age.getValue() >= 18,
    });
    if (isFailure(result)) return result;
    return ok(new DtoResUserProfile(result.value));
  }
}
```

## Proximos passos

- [UseCase](/guia/application/use-case) — orquestracao que usa o Mapper
- [Repository](/guia/infrastructure/repository) — interface de persistencia que retorna dados para o Mapper
- [Aggregate](/guia/domain-models/aggregate) — domain model que o Mapper converte
