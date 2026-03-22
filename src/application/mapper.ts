import type { IEntityProps } from "@tyforge/domain-models/entity.base";
import type { Aggregate } from "@tyforge/domain-models/aggregate.base";
import type { Result } from "@tyforge/result/result";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { Paginated } from "@tyforge/common/paginated";

export interface IMapper<
  TAggregate extends Aggregate<IEntityProps>,
  TPersistence,
> {
  toDomain(raw: TPersistence): Result<TAggregate, Exceptions>;
  toDomainMany(raw: TPersistence[]): Result<TAggregate[], Exceptions>;
  toPersistence(domain: TAggregate): Result<TPersistence, Exceptions>;
  toPersistenceMany(domains: TAggregate[]): Result<TPersistence[], Exceptions>;
  toDomainPaginated(raw: Paginated<TPersistence>): Result<Paginated<TAggregate>, Exceptions>;
}
