import { Result } from "@tyforge/result/result";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";

export interface IFactory<TAggregate, TCreateProps> {
  create(props: TCreateProps): Result<TAggregate, Exceptions>;
}
