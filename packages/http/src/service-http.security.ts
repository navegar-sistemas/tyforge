import { Result, ok, err } from "tyforge/result";
import { Exceptions } from "tyforge/exceptions";
import { ToolHeaderSecurity } from "tyforge/tools";
import { FString, FUrlFull, FUrlOrigin, FUrlPath } from "tyforge/type-fields";
import { ExceptionHttp } from "./exception-http";

export class ServiceHttpSecurity {
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

  static buildUrl(
    baseUrl: FUrlOrigin,
    endpoint: FUrlPath,
  ): Result<FUrlFull, Exceptions> {
    try {
      const safeBase = baseUrl.getValue().endsWith("/")
        ? baseUrl.getValue()
        : `${baseUrl.getValue()}/`;
      const cleanPath = endpoint.getValue().startsWith("/")
        ? endpoint.getValue().substring(1)
        : endpoint.getValue();
      return ok(
        FUrlFull.createOrThrow(new URL(cleanPath, safeBase).toString(), "url"),
      );
    } catch {
      return err(ExceptionHttp.failedUrlConstruction());
    }
  }
}
