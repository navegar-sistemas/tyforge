import { Result } from "@tyforge/result/result";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";

export interface Factory<TAggregate, TCreateProps> {
  create(props: TCreateProps): Result<TAggregate, Exceptions>;
}
