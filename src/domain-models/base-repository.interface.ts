import { ResultPromise } from "@tyforge/result/result";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { FId } from "@tyforge/type-fields/id.format_vo";
import { Paginated } from "@tyforge/common/paginated";
import { IPaginationParams } from "@tyforge/common/pagination-params";

export interface IRepositoryBase<T> {
  findById(id: FId): ResultPromise<T | null, Exceptions>;
  findAll(params?: IPaginationParams): ResultPromise<Paginated<T>, Exceptions>;
  save(entity: T): ResultPromise<T, Exceptions>;
  update(entity: T): ResultPromise<T, Exceptions>;
  delete(id: FId): ResultPromise<void, Exceptions>;
}

export interface IRepositoryBaseOptions {
  transaction?: unknown;
}
