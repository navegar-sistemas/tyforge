import { Result, ok, err } from "@tyforge/result";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { ExceptionHttp } from "./exception-http";

const ABSOLUTE_URL_REGEX = /^(?:[a-z]+:)?\/\//i;
const PATH_TRAVERSAL_REGEX = /(?:^|[/\\])\.\.(?:[/\\]|$)/;
const CRLF_TEST = /[\r\n]/;
const UNSAFE_HEADER_CHARS = /[\r\n\0]/g;
const NULL_BYTE_REGEX = /\0/;
const DANGEROUS_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export class ServiceHttpSecurity {
  static isValidRelativePath(path: string): boolean {
    if (!path || ABSOLUTE_URL_REGEX.test(path)) return false;
    if (PATH_TRAVERSAL_REGEX.test(path)) return false;
    if (NULL_BYTE_REGEX.test(path)) return false;
    if (CRLF_TEST.test(path)) return false;
    return true;
  }

  static sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (DANGEROUS_KEYS.has(key)) continue;
      const cleanKey = key.replace(UNSAFE_HEADER_CHARS, "");
      if (DANGEROUS_KEYS.has(cleanKey) || cleanKey.length === 0) continue;
      sanitized[cleanKey] = value.replace(UNSAFE_HEADER_CHARS, "");
    }
    return sanitized;
  }

  static buildUrl(baseUrl: string, endpoint: string): Result<string, Exceptions> {
    if (!ServiceHttpSecurity.isValidRelativePath(endpoint)) {
      return err(ExceptionHttp.unsafeEndpoint());
    }
    try {
      const safeBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      const cleanEndpoint = endpoint.startsWith("/") ? endpoint.substring(1) : endpoint;
      return ok(new URL(cleanEndpoint, safeBaseUrl).toString());
    } catch {
      return err(ExceptionHttp.failedUrlConstruction());
    }
  }
}
