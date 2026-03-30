import type { Result } from "tyforge/result";
import type { Exceptions } from "tyforge/exceptions";
import type { FString, FInt, FBoolean } from "tyforge/type-fields";

export type TWebSocketHandler = (data: Record<string, unknown>) => void;

export interface IWebSocketOptions {
  headers?: Record<string, FString>;
  authenticated?: FBoolean;
  timeout?: FInt;
  reconnect?: FBoolean;
  maxReconnectAttempts?: FInt;
}

export interface IWebSocketMessage {
  event: FString;
  data: Record<string, unknown>;
}

export type TWebSocketResult<T> = Promise<Result<T, Exceptions>>;
