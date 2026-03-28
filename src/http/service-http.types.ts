import type { Result } from "@tyforge/result";
import type { Exceptions } from "@tyforge/exceptions/base.exceptions";

export type THttpMethod = "POST" | "PUT" | "GET" | "DELETE" | "PATCH";
export type THttpFormat = "json" | "form";

export interface IRequestParams<TData = unknown> {
  endpoint: string;
  method: THttpMethod;
  data?: TData;
  format?: THttpFormat;
  headers?: Record<string, string>;
  authenticated?: boolean;
  timeout?: number;
}

export interface IHttpResponse<T> {
  status: number;
  data: T;
  headers: Record<string, string>;
}

export type THttpResult<T> = Promise<Result<IHttpResponse<T>, Exceptions>>;

export type TRequestOptions = Omit<IRequestParams, "endpoint" | "method" | "data">;
