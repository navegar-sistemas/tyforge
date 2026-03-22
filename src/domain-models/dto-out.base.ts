import { FHttpStatus, THttpStatus } from "@tyforge/type-fields";
import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ValueObject } from "./value-object.base";

export interface TDtoResponsePropsBase {
  status: FHttpStatus;
  body?: unknown;
  headers?: Record<string, TypeField<unknown>>;
  query?: Record<string, TypeField<unknown>>;
  params?: Record<string, TypeField<unknown>>;
}

export interface TDtoResponsePropsJson {
  status: THttpStatus;
  body?: unknown;
  headers?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export abstract class DtoResponse<TProps, TPropsJson> extends ValueObject<
  TProps,
  TPropsJson
> {
  public constructor() {
    super();
  }
}
