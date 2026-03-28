import { Result, ok, err, isFailure } from "@tyforge/result";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { TypeGuard } from "@tyforge/tools/type_guard";
import { ServiceHttpSecurity } from "./service-http.security";
import { ExceptionHttp } from "./exception-http";
import type { IRequestParams, IHttpResponse, THttpResult, TRequestOptions } from "./service-http.types";

const MAX_TIMEOUT_MS = 300000;

export abstract class ServiceHttp {
  abstract readonly baseUrl: string;

  protected abstract getAuthHeaders(): Promise<Result<Record<string, string>, Exceptions>>;

  protected async request<TData = unknown>(
    params: IRequestParams<TData>,
  ): THttpResult<unknown> {
    const { endpoint, method, data, format = "json", headers = {}, authenticated = false, timeout } = params;

    // Build URL with security validation
    const urlResult = ServiceHttpSecurity.buildUrl(this.baseUrl, endpoint);
    if (isFailure(urlResult)) return err(urlResult.error);
    const targetUrl = urlResult.value;

    // Auth headers
    let authHeaders: Record<string, string> = {};
    if (authenticated) {
      const authResult = await this.getAuthHeaders();
      if (isFailure(authResult)) return err(ExceptionHttp.authFailed(authResult.error));
      authHeaders = authResult.value;
    }

    // Prepare headers
    const mergedHeaders = this.prepareHeaders(format, authHeaders, headers);

    // Serialize body
    let body: string | undefined;
    let fetchUrl = targetUrl;
    if (data !== undefined && data !== null) {
      if (method === "GET") {
        // GET: data as query params (only primitive values)
        const url = new URL(targetUrl);
        if (TypeGuard.isRecord(data)) {
          for (const [key, value] of Object.entries(data)) {
            if (value === undefined || value === null) continue;
            if (TypeGuard.isRecord(value) || Array.isArray(value)) {
              return err(ExceptionHttp.failedSerialization());
            }
            url.searchParams.set(key, String(value));
          }
        }
        fetchUrl = url.toString();
      } else {
        // Other methods: data as body
        const serialized = this.serializeData(data, format);
        if (isFailure(serialized)) return err(serialized.error);
        body = serialized.value;
      }
    }

    // Timeout via AbortController
    const safeTimeout = timeout !== undefined && timeout >= 1
      ? Math.min(Math.max(1, Math.floor(timeout)), MAX_TIMEOUT_MS)
      : undefined;
    const controller = safeTimeout !== undefined ? new AbortController() : undefined;
    const timeoutId = controller !== undefined
      ? setTimeout(() => controller.abort(), safeTimeout)
      : undefined;

    // Execute fetch
    try {
      const response = await fetch(fetchUrl, {
        method,
        headers: mergedHeaders,
        body,
        signal: controller?.signal,
      });

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const contentType = response.headers.get("content-type") ?? "";
      const responseData: unknown = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      const httpResponse: IHttpResponse<unknown> = {
        status: response.status,
        data: responseData,
        headers: responseHeaders,
      };

      if (!response.ok) {
        return err(ExceptionHttp.externalApiFailed({ status: response.status, data: responseData }));
      }

      return ok(httpResponse);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return err(ExceptionHttp.timeout());
      }
      return err(ExceptionHttp.externalApiFailed());
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }

  private prepareHeaders(
    format: "json" | "form",
    authHeaders: Record<string, string>,
    requestHeaders: Record<string, string>,
  ): Record<string, string> {
    const contentType = format === "form"
      ? "application/x-www-form-urlencoded;charset=UTF-8"
      : "application/json;charset=UTF-8";

    return ServiceHttpSecurity.sanitizeHeaders({
      "Content-Type": contentType,
      ...authHeaders,
      ...requestHeaders,
    });
  }

  private serializeData(data: unknown, format: "json" | "form"): Result<string, Exceptions> {
    try {
      if (format === "form") {
        if (!TypeGuard.isRecord(data)) {
          return err(ExceptionHttp.failedSerialization());
        }
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(data)) {
          if (value === undefined || value === null) continue;
          if (TypeGuard.isRecord(value) || Array.isArray(value)) {
            return err(ExceptionHttp.failedSerialization());
          }
          params.set(key, String(value));
        }
        return ok(params.toString());
      }
      return ok(JSON.stringify(data));
    } catch {
      return err(ExceptionHttp.failedSerialization());
    }
  }

  // Convenience methods

  protected post<D = unknown>(endpoint: string, data: D, options: TRequestOptions = {}): THttpResult<unknown> {
    return this.request<D>({ endpoint, method: "POST", data, ...options });
  }

  protected put<D = unknown>(endpoint: string, data: D, options: TRequestOptions = {}): THttpResult<unknown> {
    return this.request<D>({ endpoint, method: "PUT", data, ...options });
  }

  protected get<D = unknown>(endpoint: string, data?: D, options: TRequestOptions = {}): THttpResult<unknown> {
    return this.request<D>({ endpoint, method: "GET", data, ...options });
  }

  protected delete<D = unknown>(endpoint: string, data?: D, options: TRequestOptions = {}): THttpResult<unknown> {
    return this.request<D>({ endpoint, method: "DELETE", data, ...options });
  }

  protected patch<D = unknown>(endpoint: string, data: D, options: TRequestOptions = {}): THttpResult<unknown> {
    return this.request<D>({ endpoint, method: "PATCH", data, ...options });
  }
}
