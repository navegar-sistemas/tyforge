export abstract class BaseOrmMapper<TDomain, TPropsJson, TOrmEntity> {
  abstract toDomain(orm: TOrmEntity): TDomain;
  abstract toOrm(domain: TDomain): TOrmEntity;
  abstract toPropsJson(domain: TDomain): TPropsJson;
}
