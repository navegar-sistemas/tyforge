import { ResultPromise } from "@tyforge/result/result";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { FId } from "@tyforge/type-fields/id.format_vo";

export interface ReadRepository<TOutput> {
  findById(id: FId): ResultPromise<TOutput | null, Exceptions>;
  findAll(filter?: Record<string, unknown>): ResultPromise<TOutput[], Exceptions>;
  count(filter?: Record<string, unknown>): ResultPromise<number, Exceptions>;
}
