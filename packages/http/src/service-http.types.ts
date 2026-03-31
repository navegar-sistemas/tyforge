import type { Result } from "tyforge/result";
import type { Exceptions } from "tyforge/exceptions";
import type {
  FInt,
  FHttpMethod,
  FHttpFormat,
  FBoolean,
  FUrlPath,
  FString,
} from "tyforge/type-fields";

export interface IRequestParams<TData = unknown> {
  endpoint: FUrlPath;
  method: FHttpMethod;
  data?: TData;
  format?: FHttpFormat;
  headers?: Record<string, FString>;
  authenticated?: FBoolean;
  timeout?: FInt;
}

export interface IHttpResponse<T> {
  status: FInt;
  data: T;
  headers: Record<string, FString>;
}

export type THttpResult<T> = Promise<Result<IHttpResponse<T>, Exceptions>>;

export type TRequestOptions = {
  format?: FHttpFormat;
  headers?: Record<string, FString>;
  authenticated?: FBoolean;
  timeout?: FInt;
};
