import { ResultPromise } from "@tyforge/result/result";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { FId } from "@tyforge/type-fields/id.format_vo";
import { IRepositoryRead } from "@tyforge/domain/read-repository";

export interface IRepositoryBase<T> extends IRepositoryRead<T> {
  create(entity: T): ResultPromise<T, Exceptions>;
  createMany(entities: T[]): ResultPromise<T[], Exceptions>;
  update(entity: T): ResultPromise<T, Exceptions>;
  updateMany(entities: T[]): ResultPromise<T[], Exceptions>;
  delete(id: FId): ResultPromise<void, Exceptions>;
  deleteMany(ids: FId[]): ResultPromise<void, Exceptions>;
  exists(id: FId): ResultPromise<boolean, Exceptions>;
  existsMany(ids: FId[]): ResultPromise<Map<string, boolean>, Exceptions>;
}

export interface IRepositoryOptions {
  transaction?: unknown;
}
