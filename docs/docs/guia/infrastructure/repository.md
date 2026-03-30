---
title: Repository
sidebar_position: 1
---

# Repository

O TyForge define classes abstratas de repositório para a camada de persistência, seguindo o padrão Repository do DDD. A hierarquia de classes fornece contratos completos para operações de leitura e CRUD com suporte a paginação.

## Hierarquia de classes

```
Repository (base abstrata)
├── RepositoryRead<TOutput>    — somente leitura
├── RepositoryWrite<TInput>    — somente escrita
└── RepositoryCrud<T>          — leitura + escrita (extends RepositoryRead + RepositoryWrite)
```

## Classes

### RepositoryRead

Classe abstrata somente-leitura:

```typescript
abstract class RepositoryRead<TOutput> {
  abstract findById(id: FId): ResultPromise<TOutput | null, Exceptions>;
  abstract findAll(params?: IPaginationParams): ResultPromise<Paginated<TOutput>, Exceptions>;
  abstract count(filter?: Record<string, unknown>): ResultPromise<number, Exceptions>;
}
```

### RepositoryCrud

Classe abstrata completa para repositórios com leitura e escrita:

```typescript
abstract class RepositoryCrud<T> extends RepositoryRead<T> {
  abstract create(entity: T): ResultPromise<T, Exceptions>;
  abstract createMany(entities: T[]): ResultPromise<T[], Exceptions>;
  abstract update(entity: T): ResultPromise<T, Exceptions>;
  abstract updateMany(entities: T[]): ResultPromise<T[], Exceptions>;
  abstract delete(id: FId): ResultPromise<void, Exceptions>;
  abstract deleteMany(ids: FId[]): ResultPromise<void, Exceptions>;
  abstract exists(id: FId): ResultPromise<boolean, Exceptions>;
  abstract existsMany(ids: FId[]): ResultPromise<Map<string, boolean>, Exceptions>;
}
```

## Métodos

| Método | Retorno | Descrição |
|--------|---------|-----------|
| `findById(id)` | `ResultPromise<T \| null>` | Busca por ID. Retorna `null` se não encontrado |
| `findAll(params?)` | `ResultPromise<Paginated<T>>` | Lista com paginação opcional |
| `count(filter?)` | `ResultPromise<number>` | Contagem total de registros |
| `create(entity)` | `ResultPromise<T>` | Cria um registro |
| `createMany(entities)` | `ResultPromise<T[]>` | Cria múltiplos registros |
| `update(entity)` | `ResultPromise<T>` | Atualiza um registro |
| `updateMany(entities)` | `ResultPromise<T[]>` | Atualiza múltiplos registros |
| `delete(id)` | `ResultPromise<void>` | Remove um registro por ID |
| `deleteMany(ids)` | `ResultPromise<void>` | Remove múltiplos registros por IDs |
| `exists(id)` | `ResultPromise<boolean>` | Verifica existência de um registro |
| `existsMany(ids)` | `ResultPromise<Map<string, boolean>>` | Verifica existência de múltiplos registros |

Todos os métodos retornam `ResultPromise<T, Exceptions>`, que é um alias para `Promise<Result<T, Exceptions>>`.

## Paginação

### IPaginationParams

Parâmetros de paginação aceitos pelo `findAll`:

```typescript
interface IPaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
```

### Paginated

`Paginated<T>` é um ValueObject que encapsula o resultado paginado. Possui factory methods `create` e `assign` compatíveis com o schema do TyForge. A propriedade `totalPages` é derivada automaticamente a partir de `totalItems` e `pageSize`.

```typescript
class Paginated<T> extends ValueObject {
  readonly items: T[];
  readonly totalItems: number;
  readonly page: number;
  readonly pageSize: number;

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  static create<T>(props: {
    items: T[];
    totalItems: number;
    page: number;
    pageSize: number;
  }): Result<Paginated<T>, Exceptions>;

  static assign<T>(props: {
    items: T[];
    totalItems: number;
    page: number;
    pageSize: number;
  }): Result<Paginated<T>, Exceptions>;
}
```

## Convenção de nomenclatura

Repositórios usam o prefixo `Repository` seguido do nome do agregado:

| Repositório | Agregado |
|-------------|----------|
| `RepositoryUser` | `User` |
| `RepositoryOrder` | `Order` |
| `RepositoryProduct` | `Product` |

## Exemplo completo

```typescript
import {
  FId, FString, FEmail, FInt, Paginated, RepositoryCrud,
  isSuccess, isFailure, ok, err,
  Exceptions, ExceptionBusiness,
} from "tyforge";
import type { ResultPromise, IPaginationParams } from "tyforge";
import { User } from "./user.aggregate";
import type { TUserJson } from "./user.aggregate";

class RepositoryUser extends RepositoryCrud<User> {
  private readonly storage = new Map<string, TUserJson>();

  async findById(id: FId): ResultPromise<User | null, Exceptions> {
    const data = this.storage.get(id.getValue());
    if (!data) return ok(null);
    return User.assign(data);
  }

  async findAll(params?: IPaginationParams): ResultPromise<Paginated<User>, Exceptions> {
    const allData = [...this.storage.values()];
    const total = allData.length;

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? total;
    const start = (page - 1) * pageSize;
    const pageData = allData.slice(start, start + pageSize);

    const users: User[] = [];
    for (const data of pageData) {
      const result = User.assign(data);
      if (isFailure(result)) return result;
      users.push(result.value);
    }

    return Paginated.create({ items: users, totalItems: total, page, pageSize });
  }

  async create(entity: User): ResultPromise<User, Exceptions> {
    const json = entity.toJSON();
    if (!json.id) return err(ExceptionBusiness.invalidBusinessRule("entidade sem id"));
    if (this.storage.has(json.id)) return err(ExceptionBusiness.duplicateEntry("id"));
    this.storage.set(json.id, json);
    return ok(entity);
  }

  async createMany(entities: User[]): ResultPromise<User[], Exceptions> {
    const saved: User[] = [];
    for (const entity of entities) {
      const result = await this.create(entity);
      if (isFailure(result)) return result;
      saved.push(result.value);
    }
    return ok(saved);
  }

  async update(entity: User): ResultPromise<User, Exceptions> {
    const json = entity.toJSON();
    if (!json.id || !this.storage.has(json.id)) {
      return err(ExceptionBusiness.notFound("User"));
    }
    this.storage.set(json.id, json);
    return ok(entity);
  }

  async updateMany(entities: User[]): ResultPromise<User[], Exceptions> {
    const updated: User[] = [];
    for (const entity of entities) {
      const result = await this.update(entity);
      if (isFailure(result)) return result;
      updated.push(result.value);
    }
    return ok(updated);
  }

  async delete(id: FId): ResultPromise<void, Exceptions> {
    if (!this.storage.has(id.getValue())) {
      return err(ExceptionBusiness.notFound("User"));
    }
    this.storage.delete(id.getValue());
    return ok(undefined);
  }

  async deleteMany(ids: FId[]): ResultPromise<void, Exceptions> {
    for (const id of ids) {
      const result = await this.delete(id);
      if (isFailure(result)) return result;
    }
    return ok(undefined);
  }

  async exists(id: FId): ResultPromise<boolean, Exceptions> {
    return ok(this.storage.has(id.getValue()));
  }

  async existsMany(ids: FId[]): ResultPromise<Map<string, boolean>, Exceptions> {
    const result = new Map<string, boolean>();
    for (const id of ids) {
      result.set(id.getValue(), this.storage.has(id.getValue()));
    }
    return ok(result);
  }

  async count(): ResultPromise<number, Exceptions> {
    return ok(this.storage.size);
  }
}
```

## Uso com paginação

```typescript
const repo = new RepositoryUser();

// Sem paginação — retorna todos
const all = await repo.findAll();
if (isSuccess(all)) {
  console.log(all.value.items.length);      // todos os itens
  console.log(all.value.totalItems);        // total de registros
}

// Com paginação — 10 itens por página, página 2
const page2 = await repo.findAll({ page: 2, pageSize: 10 });
if (isSuccess(page2)) {
  console.log(page2.value.items.length);    // até 10 itens
  console.log(page2.value.page);            // 2
  console.log(page2.value.totalPages);      // Math.ceil(totalItems / 10)
}
```

## Próximos passos

- [Mapper](/guia/application/mapper) — conversao Domain e Persistence usada pelo Repository
- [UseCase](/guia/application/use-case) — orquestracao que utiliza o Repository
- [Aggregate](/guia/domain-models/aggregate) — domain model armazenado pelo Repository
