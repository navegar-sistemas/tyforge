import { FHttpStatus, THttpStatus } from "@tyforge/type-fields";
import { TypeField } from "@tyforge/type-fields/_base/type-field.base";
import { ValueObject } from "./value-object.base";

export interface TDtoResProps {
  status: FHttpStatus;
  body?: unknown;
  headers?: Record<string, TypeField<unknown>>;
  query?: Record<string, TypeField<unknown>>;
  params?: Record<string, TypeField<unknown>>;
}

export interface TDtoResPropsJson {
  status: THttpStatus;
  body?: unknown;
  headers?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export abstract class DtoRes<
  TProps extends TDtoResProps,
  TPropsJson extends TDtoResPropsJson,
> extends ValueObject<TProps, TPropsJson> {
  protected constructor() {
    super();
  }
}
