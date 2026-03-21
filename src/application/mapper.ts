export interface Mapper<TDomain, TPropsJson, TDto = TPropsJson> {
  toDomain(raw: TPropsJson): TDomain;
  toPropsJson(domain: TDomain): TPropsJson;
  toDto(domain: TDomain): TDto;
}
