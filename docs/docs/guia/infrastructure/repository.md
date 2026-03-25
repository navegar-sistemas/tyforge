---
title: Repository
sidebar_position: 1
---

# Repository

O TyForge define interfaces de repositorio para a camada de persistencia, seguindo o padrao Repository do DDD. A interface `IRepositoryBase<T>` fornece um contrato completo para operacoes CRUD com suporte a paginacao.

## Interfaces

### IRepositoryRead

Interface base somente-leitura, herdada por `IRepositoryBase`:

```typescript
interface IRepositoryRead<TOutput> {
  findById(id: FId): ResultPromise<TOutput | null, Exceptions>;
  findAll(params?: IPaginationParams): ResultPromise<Paginated<TOutput>, Exceptions>;
  count(filter?: Record<string, unknown>): ResultPromise<number, Exceptions>;
}
```

### IRepositoryBase

Interface completa para repositorios com leitura e escrita:

```typescript
interface IRepositoryBase<T> extends IRepositoryRead<T> {
  create(entity: T): ResultPromise<T, Exceptions>;
  createMany(entities: T[]): ResultPromise<T[], Exceptions>;
  update(entity: T): ResultPromise<T, Exceptions>;
  updateMany(entities: T[]): ResultPromise<T[], Exceptions>;
  delete(id: FId): ResultPromise<void, Exceptions>;
  deleteMany(ids: FId[]): ResultPromise<void, Exceptions>;
  exists(id: FId): ResultPromise<boolean, Exceptions>;
  existsMany(ids: FId[]): ResultPromise<Map<string, boolean>, Exceptions>;
}
```

## Metodos

| Metodo | Retorno | Descricao |
|--------|---------|-----------|
| `findById(id)` | `ResultPromise<T \| null>` | Busca por ID. Retorna `null` se nao encontrado |
| `findAll(params?)` | `ResultPromise<Paginated<T>>` | Lista com paginacao opcional |
| `count(filter?)` | `ResultPromise<number>` | Contagem total de registros |
| `create(entity)` | `ResultPromise<T>` | Cria um registro |
| `createMany(entities)` | `ResultPromise<T[]>` | Cria multiplos registros |
| `update(entity)` | `ResultPromise<T>` | Atualiza um registro |
| `updateMany(entities)` | `ResultPromise<T[]>` | Atualiza multiplos registros |
| `delete(id)` | `ResultPromise<void>` | Remove um registro por ID |
| `deleteMany(ids)` | `ResultPromise<void>` | Remove multiplos registros por IDs |
| `exists(id)` | `ResultPromise<boolean>` | Verifica existencia de um registro |
| `existsMany(ids)` | `ResultPromise<Map<string, boolean>>` | Verifica existencia de multiplos registros |

Todos os metodos retornam `ResultPromise<T, Exceptions>`, que e um alias para `Promise<Result<T, Exceptions>>`.

## Paginacao

### IPaginationParams

Parametros de paginacao aceitos pelo `findAll`:

```typescript
interface IPaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
```

### Paginated

Classe que encapsula o resultado paginado:

```typescript
class Paginated<T> {
  constructor(
    readonly items: T[],
    readonly total: number,
    readonly page: number,
    readonly pageSize: number,
  ) {}

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }
}
```

## Convencao de nomenclatura

Repositorios usam o prefixo `Repository` seguido do nome do agregado:

| Repositorio | Agregado |
|-------------|----------|
| `RepositoryUser` | `User` |
| `RepositoryOrder` | `Order` |
| `RepositoryProduct` | `Product` |

## Exemplo completo

```typescript
import {
  FId, FString, FEmail, FInt, Paginated,
  isSuccess, isFailure, ok, err,
  Exceptions, ExceptionBusiness,
} from "tyforge";
import type { IRepositoryBase, ResultPromise, IPaginationParams } from "tyforge";
import { User } from "./user.aggregate";
import type { TUserJson } from "./user.aggregate";

class RepositoryUser implements IRepositoryBase<User> {
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

    return ok(new Paginated(users, total, page, pageSize));
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

## Uso com paginacao

```typescript
const repo = new RepositoryUser();

// Sem paginacao — retorna todos
const all = await repo.findAll();
if (isSuccess(all)) {
  console.log(all.value.items.length);  // todos os itens
  console.log(all.value.total);         // total de registros
}

// Com paginacao — 10 itens por pagina, pagina 2
const page2 = await repo.findAll({ page: 2, pageSize: 10 });
if (isSuccess(page2)) {
  console.log(page2.value.items.length);  // ate 10 itens
  console.log(page2.value.page);          // 2
  console.log(page2.value.totalPages);    // Math.ceil(total / 10)
}
```

## Proximos passos

- [Mapper](/guia/application/mapper) — conversao Domain e Persistence usada pelo Repository
- [UseCase](/guia/application/use-case) — orquestracao que utiliza o Repository
- [Aggregate](/guia/domain-models/aggregate) — domain model armazenado pelo Repository
