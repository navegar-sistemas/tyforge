import type { ResultPromise } from "@tyforge/result/result";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { TEntityId } from "./entity.base";
import type { FInt } from "@tyforge/type-fields/primitive/int.typefield";
import type { Paginated } from "@tyforge/common/paginated";
import type { IPaginationParams } from "@tyforge/common/pagination-params";
import { Repository } from "@tyforge/domain/repository";

export abstract class RepositoryCrud<T> extends Repository {
  abstract findById(id: TEntityId): ResultPromise<T | null, Exceptions>;
  abstract findAll(
    params?: IPaginationParams,
  ): ResultPromise<Paginated<T>, Exceptions>;
  abstract count(
    filter?: Record<string, unknown>,
  ): ResultPromise<FInt, Exceptions>;
  abstract create(entity: T): ResultPromise<T, Exceptions>;
  abstract createMany(entities: T[]): ResultPromise<T[], Exceptions>;
  abstract update(entity: T): ResultPromise<T, Exceptions>;
  abstract updateMany(entities: T[]): ResultPromise<T[], Exceptions>;
  abstract delete(id: TEntityId): ResultPromise<void, Exceptions>;
  abstract deleteMany(ids: TEntityId[]): ResultPromise<void, Exceptions>;
}
