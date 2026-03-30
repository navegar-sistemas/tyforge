import type { Result } from "tyforge/result";
import type { Exceptions } from "tyforge/exceptions";
import type { FString, FInt, FBoolean, FFetchPolicy, FGraphQLDocument, FGraphQLOperationName } from "tyforge/type-fields";

export interface IGraphQLRequest {
  query: FGraphQLDocument;
  variables?: Record<string, FString>;
  operationName?: FGraphQLOperationName;
  headers?: Record<string, FString>;
  authenticated?: FBoolean;
  timeout?: FInt;
  fetchPolicy?: FFetchPolicy;
}

export interface IGraphQLError {
  message: string;
  locations?: ReadonlyArray<{ line: number; column: number }>;
  path?: ReadonlyArray<string | number>;
  extensions?: Record<string, unknown>;
}

export interface IGraphQLResponse<TData> {
  data: TData;
  errors?: IGraphQLError[];
}

export type TGraphQLResult<T> = Promise<Result<T, Exceptions>>;

export type TGraphQLRequestOptions = {
  operationName?: FGraphQLOperationName;
  headers?: Record<string, FString>;
  authenticated?: FBoolean;
  timeout?: FInt;
  fetchPolicy?: FFetchPolicy;
};
