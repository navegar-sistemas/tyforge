import { FHttpStatus, THttpStatus } from "@tyforge/type-fields";
import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ValueObject } from "./value-object.base";

export interface TDtoPropsBase {
  status?: FHttpStatus;
  body?: unknown;
  headers?: Record<string, TypeField<unknown>>;
  query?: Record<string, TypeField<unknown>>;
  params?: Record<string, TypeField<unknown>>;
  [key: string]: unknown;
}

export interface TDtoPropsJson {
  status?: THttpStatus;
  body?: unknown;
  headers?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
  [key: string]: unknown;
}

export abstract class Dto<
  TProps extends TDtoPropsBase,
  TPropsJson extends TDtoPropsJson,
> extends ValueObject<TProps, TPropsJson> {
  public constructor() {
    super();
  }
}
