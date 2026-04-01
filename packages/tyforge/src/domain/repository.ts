import type { ResultPromise } from "@tyforge/result/result";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { TEntityId } from "@tyforge/domain-models/entity.base";
import type { FBoolean } from "@tyforge/type-fields/primitive/boolean.typefield";

export abstract class Repository {
  abstract exists(id: TEntityId): ResultPromise<FBoolean, Exceptions>;
  abstract existsMany(
    ids: TEntityId[],
  ): ResultPromise<Map<string, FBoolean>, Exceptions>;
}
