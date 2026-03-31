import { Result, ok, err, isFailure } from "tyforge/result";
import { Exceptions } from "tyforge/exceptions";
import { TypeGuard, ToolHeaderSecurity } from "tyforge/tools";
import { FString } from "tyforge/type-fields";
import { ExceptionWebSocket } from "./exception-websocket";

// Prototype pollution vectors — must be stripped from user-supplied message data
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_SANITIZE_DEPTH = 50;

export class ServiceWebSocketSecurity {
  static sanitizeHeaders(
    headers: Record<string, FString>,
  ): Record<string, FString> {
    const primitiveRecord: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      primitiveRecord[key] = value.getValue();
    }
    const sanitized = ToolHeaderSecurity.sanitizeHeaders(primitiveRecord);
    const result: Record<string, FString> = {};
    for (const [key, value] of Object.entries(sanitized)) {
      result[key] = FString.createOrThrow(value, key);
    }
    return result;
  }

  static sanitizeMessage(
    data: Record<string, unknown>,
    depth = 0,
  ): Result<Record<string, unknown>, Exceptions> {
    if (depth >= MAX_SANITIZE_DEPTH) {
      return err(ExceptionWebSocket.invalidMessage());
    }
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      if (TypeGuard.isRecord(value)) {
        const nested = ServiceWebSocketSecurity.sanitizeMessage(
          value,
          depth + 1,
        );
        if (isFailure(nested)) return nested;
        sanitized[key] = nested.value;
      } else if (Array.isArray(value)) {
        const items: unknown[] = [];
        for (const item of value) {
          if (TypeGuard.isRecord(item)) {
            const nested = ServiceWebSocketSecurity.sanitizeMessage(
              item,
              depth + 1,
            );
            if (isFailure(nested)) return nested;
            items.push(nested.value);
          } else {
            items.push(item);
          }
        }
        sanitized[key] = items;
      } else {
        sanitized[key] = value;
      }
    }
    return ok(sanitized);
  }
}
