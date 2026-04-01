import type { ResultPromise } from "@tyforge/result/result";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { TEntityId } from "@tyforge/domain-models/entity.base";
import type { FInt } from "@tyforge/type-fields/primitive/int.typefield";
import type { Paginated } from "@tyforge/common/paginated";
import type { IPaginationParams } from "@tyforge/common/pagination-params";
import { Repository } from "./repository";

export abstract class RepositoryRead<
  TOutput,
  TFilter = Record<string, unknown>,
> extends Repository {
  abstract findById(id: TEntityId): ResultPromise<TOutput | null, Exceptions>;
  abstract findAll(
    params?: IPaginationParams,
  ): ResultPromise<Paginated<TOutput>, Exceptions>;
  abstract count(filter?: TFilter): ResultPromise<FInt, Exceptions>;
}
