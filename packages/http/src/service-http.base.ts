import { Result, ok, err, isFailure } from "tyforge/result";
import { Exceptions } from "tyforge/exceptions";
import { ServiceBase } from "tyforge";
import { TypeGuard } from "tyforge/tools";
import { FString, FInt, FHttpMethod, FHttpFormat, FUrlPath } from "tyforge/type-fields";
import { ServiceHttpSecurity } from "./service-http.security";
import { ExceptionHttp } from "./exception-http";
import type { IRequestParams, IHttpResponse, THttpResult, TRequestOptions } from "./service-http.types";

const MAX_TIMEOUT_MS = 300000;
const MAX_RESPONSE_BYTES = 10485760;

export abstract class ServiceHttp extends ServiceBase {

  protected async request<TData = unknown>(
    params: IRequestParams<TData>,
  ): THttpResult<unknown> {
    const { endpoint: path, method, data, format: rawFormat, headers: rawHeaders, authenticated: rawAuthenticated, timeout } = params;

    const format = rawFormat ?? FHttpFormat.createOrThrow("json");

    if (timeout !== undefined && (timeout.getValue() < 1 || timeout.getValue() > MAX_TIMEOUT_MS)) {
      return err(ExceptionHttp.invalidParams(`Timeout must be between 1 and ${MAX_TIMEOUT_MS} ms.`));
    }

    const urlResult = ServiceHttpSecurity.buildUrl(this.endpoint, path);
    if (isFailure(urlResult)) return err(urlResult.error);

    let authHeaders: Record<string, FString> = {};
    if (rawAuthenticated?.getValue() ?? false) {
      const authResult = await this.getAuthHeaders();
      if (isFailure(authResult)) return err(ExceptionHttp.authFailed(authResult.error));
      authHeaders = authResult.value;
    }

    const mergedHeaders = this.prepareHeaders(format, authHeaders, rawHeaders ?? {});

    const fetchHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(mergedHeaders)) {
      fetchHeaders[key] = value.getValue();
    }

    let body: string | undefined;
    let fetchUrl = urlResult.value.getValue();
    if (data !== undefined && data !== null) {
      if (method.getValue() === "GET") {
        const url = new URL(urlResult.value.getValue());
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
        const serialized = this.serializeData(data, format);
        if (isFailure(serialized)) return err(serialized.error);
        body = serialized.value;
      }
    }

    const timeoutMs = timeout?.getValue();
    const controller = timeoutMs !== undefined ? new AbortController() : undefined;
    const timeoutId = controller !== undefined
      ? setTimeout(() => controller.abort(), timeoutMs)
      : undefined;

    // DNS rebinding protection: resolve hostname and validate against private ranges
    const dnsValid = await this.validateEndpointDns();
    if (!dnsValid) {
      return err(ExceptionHttp.unsafeEndpoint());
    }

    try {
      const response = await fetch(fetchUrl, {
        method: method.getValue(),
        headers: fetchHeaders,
        body,
        signal: controller?.signal,
        redirect: "error",
      });

      const responseHeaders: Record<string, FString> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = FString.createOrThrow(value, key);
      });

      const contentLength = response.headers.get("content-length");
      if (contentLength !== null && parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
        return err(ExceptionHttp.invalidParams(`Response exceeds maximum size of ${MAX_RESPONSE_BYTES} bytes.`));
      }

      const responseText = await response.text();
      if (responseText.length > MAX_RESPONSE_BYTES) {
        return err(ExceptionHttp.invalidParams(`Response exceeds maximum size of ${MAX_RESPONSE_BYTES} bytes.`));
      }

      const contentType = response.headers.get("content-type") ?? "";
      const responseData: unknown = contentType.includes("application/json")
        ? JSON.parse(responseText)
        : responseText;

      const httpResponse: IHttpResponse<unknown> = {
        status: FInt.createOrThrow(response.status, "status"),
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
      if (e instanceof TypeError && String(e.message).includes("redirect")) {
        return err(ExceptionHttp.unsafeEndpoint());
      }
      return err(ExceptionHttp.externalApiFailed());
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }

  private prepareHeaders(
    format: FHttpFormat,
    authHeaders: Record<string, FString>,
    requestHeaders: Record<string, FString>,
  ): Record<string, FString> {
    const contentType = FString.createOrThrow(
      format.getValue() === "form"
        ? "application/x-www-form-urlencoded;charset=UTF-8"
        : "application/json;charset=UTF-8",
      "Content-Type",
    );

    return ServiceHttpSecurity.sanitizeHeaders({
      "Content-Type": contentType,
      ...authHeaders,
      ...requestHeaders,
    });
  }

  private serializeData(data: unknown, format: FHttpFormat): Result<string, Exceptions> {
    try {
      if (format.getValue() === "form") {
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

  protected post<D = unknown>(endpoint: FUrlPath, data: D, options: TRequestOptions = {}): THttpResult<unknown> {
    return this.request<D>({ endpoint, method: FHttpMethod.createOrThrow("POST"), data, ...options });
  }

  protected put<D = unknown>(endpoint: FUrlPath, data: D, options: TRequestOptions = {}): THttpResult<unknown> {
    return this.request<D>({ endpoint, method: FHttpMethod.createOrThrow("PUT"), data, ...options });
  }

  protected get<D = unknown>(endpoint: FUrlPath, data?: D, options: TRequestOptions = {}): THttpResult<unknown> {
    return this.request<D>({ endpoint, method: FHttpMethod.createOrThrow("GET"), data, ...options });
  }

  protected delete<D = unknown>(endpoint: FUrlPath, data?: D, options: TRequestOptions = {}): THttpResult<unknown> {
    return this.request<D>({ endpoint, method: FHttpMethod.createOrThrow("DELETE"), data, ...options });
  }

  protected patch<D = unknown>(endpoint: FUrlPath, data: D, options: TRequestOptions = {}): THttpResult<unknown> {
    return this.request<D>({ endpoint, method: FHttpMethod.createOrThrow("PATCH"), data, ...options });
  }
}
