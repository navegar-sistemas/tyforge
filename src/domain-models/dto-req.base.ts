import { TypeField } from "@tyforge/type-fields/type-field.base";
import { ValueObject } from "./value-object.base";

export interface TDtoReqProps {
  body?: unknown;
  headers?: Record<string, TypeField<unknown>>;
  query?: Record<string, TypeField<unknown>>;
  params?: Record<string, TypeField<unknown>>;
}

export interface TDtoReqPropsJson {
  body?: unknown;
  headers?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

export abstract class DtoReq<
  TProps extends TDtoReqProps,
  TPropsJson extends TDtoReqPropsJson,
> extends ValueObject<TProps, TPropsJson> {
  protected constructor() {
    super();
  }
}
