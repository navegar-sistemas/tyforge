import type { ResultPromise } from "@tyforge/result/result";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { TEntityId } from "@tyforge/domain-models/entity.base";
import { Repository } from "./repository";

export abstract class RepositoryWrite<T> extends Repository {
  abstract create(entity: T): ResultPromise<T, Exceptions>;
  abstract createMany(entities: T[]): ResultPromise<T[], Exceptions>;
  abstract update(entity: T): ResultPromise<T, Exceptions>;
  abstract updateMany(entities: T[]): ResultPromise<T[], Exceptions>;
  abstract delete(id: TEntityId): ResultPromise<void, Exceptions>;
  abstract deleteMany(ids: TEntityId[]): ResultPromise<void, Exceptions>;
}
