import type { ResultPromise } from "@tyforge/result/result";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { FId } from "@tyforge/type-fields/identity/id.typefield";
import { Repository } from "./repository";

export abstract class RepositoryWrite<T> extends Repository {
  abstract create(entity: T): ResultPromise<T, Exceptions>;
  abstract createMany(entities: T[]): ResultPromise<T[], Exceptions>;
  abstract update(entity: T): ResultPromise<T, Exceptions>;
  abstract updateMany(entities: T[]): ResultPromise<T[], Exceptions>;
  abstract delete(id: FId): ResultPromise<void, Exceptions>;
  abstract deleteMany(ids: FId[]): ResultPromise<void, Exceptions>;
}
