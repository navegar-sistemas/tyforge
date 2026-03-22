import type { IEntityPropsBase } from "@tyforge/domain-models/entity.base";
import type { Aggregate } from "@tyforge/domain-models/aggregate.base";
import type { Dto, TDtoPropsBase, TDtoPropsJson } from "@tyforge/domain-models/dto.base";
import type { DtoResponse } from "@tyforge/domain-models/dto-response.base";

export interface IMapper<
  TAggregate extends Aggregate<IEntityPropsBase>,
  TPersistence,
  TDtoIn extends Dto<TDtoPropsBase, TDtoPropsJson> = Dto<TDtoPropsBase, TDtoPropsJson>,
  TDtoOut extends DtoResponse<unknown, unknown> = DtoResponse<unknown, unknown>,
  TRequestRaw = unknown,
  TResponseInput = TAggregate,
> {
  toDomain(raw: TPersistence): TAggregate;
  toPersistence(domain: TAggregate): TPersistence;
  toResponse(input: TResponseInput): TDtoOut;
  toRequest(raw: TRequestRaw): TDtoIn;
}
