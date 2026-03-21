import { ResultPromise } from "@tyforge/tools";
import { Exceptions } from "@tyforge/exceptions";
import { FId } from "@tyforge/type-fields";

export interface IBaseRepository<T> {
  findById(id: FId): ResultPromise<T | null, Exceptions>;
  findAll(): ResultPromise<T[], Exceptions>;
  save(entity: T): ResultPromise<T, Exceptions>;
  update(entity: T): ResultPromise<T, Exceptions>;
  delete(id: FId): ResultPromise<void, Exceptions>;
}

export interface IRepositoryOptions {
  transaction?: unknown;
}
