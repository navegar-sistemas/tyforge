import type { ResultPromise } from "@tyforge/result/result";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";
import type { FId } from "@tyforge/type-fields/identity/id.typefield";
import type { FBoolean } from "@tyforge/type-fields/primitive/boolean.typefield";

export abstract class Repository {
  abstract exists(id: FId): ResultPromise<FBoolean, Exceptions>;
  abstract existsMany(ids: FId[]): ResultPromise<Map<string, FBoolean>, Exceptions>;
}
