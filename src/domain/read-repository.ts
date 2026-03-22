import { ResultPromise } from "@tyforge/result/result";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { FId } from "@tyforge/type-fields/id.format_vo";
import { Paginated } from "@tyforge/common/paginated";
import { IPaginationParams } from "@tyforge/common/pagination-params";

export interface IRepositoryRead<TOutput> {
  findById(id: FId): ResultPromise<TOutput | null, Exceptions>;
  findAll(params?: IPaginationParams): ResultPromise<Paginated<TOutput>, Exceptions>;
  count(filter?: Record<string, unknown>): ResultPromise<number, Exceptions>;
}
