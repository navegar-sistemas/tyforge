import type { IEntityPropsBase } from "@tyforge/domain-models/entity.base";
import type { Aggregate } from "@tyforge/domain-models/agreggate.base";
import type { Dto, TDtoPropsBase, TDtoPropsJson } from "@tyforge/domain-models/dto.base";
import type { DtoResponse } from "@tyforge/domain-models/dto-out.base";

export interface IMapper<
  TAggregate extends Aggregate<IEntityPropsBase>,
  TPersistence,
  TDtoIn extends Dto<TDtoPropsBase, TDtoPropsJson> = Dto<TDtoPropsBase, TDtoPropsJson>,
  TDtoResponse extends DtoResponse<unknown, unknown> = DtoResponse<unknown, unknown>,
> {
  toDomain(raw: TPersistence): TAggregate;
  toPersistence(domain: TAggregate): TPersistence;
  toResponse(input: unknown): TDtoResponse;
  toRequest(raw: unknown): TDtoIn;
}
