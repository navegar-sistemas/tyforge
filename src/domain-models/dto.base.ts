import { ValueObject } from "./value-object.base";

export abstract class Dto<
  TProps,
  TPropsJson,
> extends ValueObject<TProps, TPropsJson> {
  protected constructor() {
    super();
  }
}
