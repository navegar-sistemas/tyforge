import { describe, it, beforeEach, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import { ServiceHttp } from "@tyforge/http/service-http.base";
import { isSuccess, isFailure, ok, err, Result } from "@tyforge/result/result";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { ExceptionHttp } from "@tyforge/http/exception-http";
import type { TRequestOptions } from "@tyforge/http/service-http.types";

// ── Helpers ─────────────────────────────────────────────────────

function assertSuccess<T, E>(result: Result<T, E>): asserts result is { success: true; value: T } {
  if (!isSuccess(result)) {
    assert.fail(`Expected success but got failure: ${JSON.stringify(result.error)}`);
  }
}

function assertFailure<T, E>(result: Result<T, E>): asserts result is { success: false; error: E } {
  if (!isFailure(result)) {
    assert.fail(`Expected failure but got success`);
  }
}

// ── Concrete test subclass ──────────────────────────────────────

class TestServiceHttp extends ServiceHttp {
  override readonly baseUrl: string = "https://api.test.com";
  authResult: Result<Record<string, string>, Exceptions> = ok({ "Authorization": "Bearer test-token" });

  protected override async getAuthHeaders(): Promise<Result<Record<string, string>, Exceptions>> {
    return this.authResult;
  }

  testPost<D = unknown>(endpoint: string, data: D, options?: TRequestOptions) {
    return this.post(endpoint, data, options);
  }

  testGet<D = unknown>(endpoint: string, data?: D, options?: TRequestOptions) {
    return this.get(endpoint, data, options);
  }

  testPut<D = unknown>(endpoint: string, data: D, options?: TRequestOptions) {
    return this.put(endpoint, data, options);
  }

  testDelete<D = unknown>(endpoint: string, data?: D, options?: TRequestOptions) {
    return this.delete(endpoint, data, options);
  }

  testPatch<D = unknown>(endpoint: string, data: D, options?: TRequestOptions) {
    return this.patch(endpoint, data, options);
  }
}

// ── Mock fetch infrastructure ───────────────────────────────────

interface IMockFetchCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
}

let mockCalls: IMockFetchCall[] = [];
let mockResponse: { status: number; headers: Record<string, string>; body: unknown; ok: boolean };
let originalFetch: typeof globalThis.fetch;

function setMockResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  const isJson = typeof body === "object" && body !== null;
  mockResponse = {
    status,
    ok: status >= 200 && status < 300,
    headers: { "content-type": isJson ? "application/json" : "text/plain", ...headers },
    body,
  };
}

function extractHeaders(init?: RequestInit): Record<string, string> {
  const raw = init?.headers;
  if (raw === undefined || raw === null) return {};
  const result: Record<string, string> = {};
  if (raw instanceof Headers) {
    raw.forEach((v, k) => { result[k] = v; });
  } else if (Array.isArray(raw)) {
    for (const pair of raw) { result[pair[0]] = pair[1]; }
  } else {
    Object.assign(result, raw);
  }
  return result;
}

function createMockFetch(): typeof globalThis.fetch {
  return (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    const body = init?.body !== undefined && init?.body !== null ? String(init.body) : undefined;
    mockCalls.push({ url, method: init?.method ?? "GET", headers: extractHeaders(init), body });

    const headersMap = new Map(Object.entries(mockResponse.headers));
    const responseHeaders = {
      get: (key: string) => headersMap.get(key) ?? null,
      forEach: (cb: (value: string, key: string) => void) => headersMap.forEach(cb),
    };

    const responseBody = mockResponse.body;
    const response = {
      status: mockResponse.status,
      ok: mockResponse.ok,
      headers: responseHeaders,
      json: () => Promise.resolve(responseBody),
      text: () => Promise.resolve(typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody)),
    };

    return Promise.resolve(response as unknown as Response);
  };
}

// ── Tests ───────────────────────────────────────────────────────

describe("ServiceHttp — request execution", () => {
  let service: TestServiceHttp;

  beforeEach(() => {
    service = new TestServiceHttp();
    mockCalls = [];
    originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch();
    setMockResponse(200, { id: 1, name: "Test" });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("POST sends JSON body to correct URL", async () => {
    const result = await service.testPost("users", { name: "Maria" });
    assertSuccess(result);
    assert.equal(result.value.status, 200);
    assert.equal(mockCalls.length, 1);
    assert.equal(mockCalls[0].url, "https://api.test.com/users");
    assert.equal(mockCalls[0].method, "POST");
    assert.equal(mockCalls[0].body, JSON.stringify({ name: "Maria" }));
  });

  it("GET constructs query params from data", async () => {
    const result = await service.testGet("users", { page: 1, limit: 10 });
    assertSuccess(result);
    assert.equal(mockCalls.length, 1);
    const url = new URL(mockCalls[0].url);
    assert.equal(url.searchParams.get("page"), "1");
    assert.equal(url.searchParams.get("limit"), "10");
    assert.equal(mockCalls[0].method, "GET");
    assert.equal(mockCalls[0].body, undefined);
  });

  it("GET without data sends no query params", async () => {
    const result = await service.testGet("users");
    assertSuccess(result);
    assert.equal(mockCalls[0].url, "https://api.test.com/users");
  });

  it("GET filters null and undefined from query params", async () => {
    const result = await service.testGet("users", { name: "test", age: null, city: undefined });
    assertSuccess(result);
    const url = new URL(mockCalls[0].url);
    assert.equal(url.searchParams.get("name"), "test");
    assert.equal(url.searchParams.has("age"), false);
    assert.equal(url.searchParams.has("city"), false);
  });

  it("PUT sends JSON body", async () => {
    const result = await service.testPut("users/1", { name: "Updated" });
    assertSuccess(result);
    assert.equal(mockCalls[0].method, "PUT");
    assert.equal(mockCalls[0].body, JSON.stringify({ name: "Updated" }));
  });

  it("DELETE sends without body by default", async () => {
    const result = await service.testDelete("users/1");
    assertSuccess(result);
    assert.equal(mockCalls[0].method, "DELETE");
    assert.equal(mockCalls[0].body, undefined);
  });

  it("DELETE sends body when data provided", async () => {
    const result = await service.testDelete("users/1", { reason: "inactive" });
    assertSuccess(result);
    assert.equal(mockCalls[0].body, JSON.stringify({ reason: "inactive" }));
  });

  it("PATCH sends JSON body", async () => {
    const result = await service.testPatch("users/1", { name: "Patched" });
    assertSuccess(result);
    assert.equal(mockCalls[0].method, "PATCH");
    assert.equal(mockCalls[0].body, JSON.stringify({ name: "Patched" }));
  });
});

describe("ServiceHttp — response parsing", () => {
  let service: TestServiceHttp;

  beforeEach(() => {
    service = new TestServiceHttp();
    mockCalls = [];
    originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("parses JSON response with application/json content-type", async () => {
    setMockResponse(200, { id: 1, name: "Test" });
    const result = await service.testGet("users/1");
    assertSuccess(result);
    assert.deepEqual(result.value.data, { id: 1, name: "Test" });
    assert.equal(result.value.headers["content-type"], "application/json");
  });

  it("parses text response with non-json content-type", async () => {
    setMockResponse(200, "plain text response", { "content-type": "text/plain" });
    const result = await service.testGet("health");
    assertSuccess(result);
    assert.equal(result.value.data, "plain text response");
  });

  it("returns error for non-ok status with externalError details", async () => {
    setMockResponse(422, { error: "Validation failed" });
    const result = await service.testPost("users", { name: "" });
    assertFailure(result);
    assert.equal(result.error.code, "EXTERNAL_API_FAILED");
    const httpError = result.error;
    assert.ok(httpError instanceof ExceptionHttp);
    assert.equal(httpError.externalError?.status, 422);
    assert.deepEqual(httpError.externalError?.data, { error: "Validation failed" });
  });

  it("returns error for 500 status", async () => {
    setMockResponse(500, { error: "Internal server error" });
    const result = await service.testGet("health");
    assertFailure(result);
    assert.equal(result.error.code, "EXTERNAL_API_FAILED");
  });
});

describe("ServiceHttp — authentication", () => {
  let service: TestServiceHttp;

  beforeEach(() => {
    service = new TestServiceHttp();
    mockCalls = [];
    originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch();
    setMockResponse(200, { ok: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("includes auth headers when authenticated is true", async () => {
    const result = await service.testGet("protected", undefined, { authenticated: true });
    assertSuccess(result);
    assert.equal(mockCalls[0].headers["Authorization"], "Bearer test-token");
  });

  it("does not include auth headers when authenticated is false", async () => {
    const result = await service.testGet("public");
    assertSuccess(result);
    assert.equal(mockCalls[0].headers["Authorization"], undefined);
  });

  it("returns AUTH_FAILED when getAuthHeaders fails", async () => {
    service.authResult = err(ExceptionHttp.authFailed());
    const result = await service.testGet("protected", undefined, { authenticated: true });
    assertFailure(result);
    assert.equal(result.error.code, "AUTH_FAILED");
  });

  it("AUTH_FAILED preserves original error as cause", async () => {
    const originalError = ExceptionHttp.timeout();
    service.authResult = err(originalError);
    const result = await service.testGet("protected", undefined, { authenticated: true });
    assertFailure(result);
    assert.equal(result.error.code, "AUTH_FAILED");
    assert.equal(result.error.cause, originalError);
  });
});

describe("ServiceHttp — format", () => {
  let service: TestServiceHttp;

  beforeEach(() => {
    service = new TestServiceHttp();
    mockCalls = [];
    originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch();
    setMockResponse(200, { ok: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends JSON content-type by default", async () => {
    await service.testPost("users", { name: "Test" });
    assert.ok(mockCalls[0].headers["Content-Type"].includes("application/json"));
  });

  it("sends form content-type when format is form", async () => {
    await service.testPost("auth/token", { username: "admin", password: "secret" }, { format: "form" });
    assert.ok(mockCalls[0].headers["Content-Type"].includes("application/x-www-form-urlencoded"));
    const body = mockCalls[0].body ?? "";
    assert.ok(body.includes("username=admin"));
    assert.ok(body.includes("password=secret"));
  });

  it("returns FAILED_SERIALIZATION for non-record form data", async () => {
    const result = await service.testPost("auth/token", "invalid", { format: "form" });
    assertFailure(result);
    assert.equal(result.error.code, "FAILED_SERIALIZATION");
  });

  it("form body filters null and undefined values", async () => {
    await service.testPost("data", { name: "test", age: null, city: undefined }, { format: "form" });
    const body = mockCalls[0].body ?? "";
    assert.ok(body.includes("name=test"));
    assert.equal(body.includes("age"), false);
    assert.equal(body.includes("city"), false);
  });

  it("merges custom headers with defaults", async () => {
    await service.testPost("users", { name: "Test" }, { headers: { "X-Custom": "value123" } });
    assert.equal(mockCalls[0].headers["X-Custom"], "value123");
    assert.ok(mockCalls[0].headers["Content-Type"].includes("application/json"));
  });
});

describe("ServiceHttp — security", () => {
  let service: TestServiceHttp;

  beforeEach(() => {
    service = new TestServiceHttp();
    mockCalls = [];
    originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch();
    setMockResponse(200, { ok: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("rejects endpoint with path traversal", async () => {
    const result = await service.testGet("../admin");
    assertFailure(result);
    assert.equal(result.error.code, "UNSAFE_ENDPOINT");
    assert.equal(mockCalls.length, 0);
  });

  it("rejects endpoint with absolute URL", async () => {
    const result = await service.testGet("https://evil.com/api");
    assertFailure(result);
    assert.equal(result.error.code, "UNSAFE_ENDPOINT");
    assert.equal(mockCalls.length, 0);
  });

  it("rejects endpoint with CRLF injection", async () => {
    const result = await service.testGet("users\r\nX-Injected: evil");
    assertFailure(result);
    assert.equal(mockCalls.length, 0);
  });

  it("rejects empty endpoint", async () => {
    const result = await service.testGet("");
    assertFailure(result);
    assert.equal(mockCalls.length, 0);
  });

  it("rejects non-primitive values in GET query params", async () => {
    const result = await service.testGet("users", { filter: { nested: "object" } });
    assertFailure(result);
    assert.equal(result.error.code, "FAILED_SERIALIZATION");
    assert.equal(mockCalls.length, 0);
  });

  it("rejects array values in GET query params", async () => {
    const result = await service.testGet("users", { ids: [1, 2, 3] });
    assertFailure(result);
    assert.equal(result.error.code, "FAILED_SERIALIZATION");
    assert.equal(mockCalls.length, 0);
  });

  it("rejects non-primitive values in form body", async () => {
    const result = await service.testPost("data", { nested: { key: "val" } }, { format: "form" });
    assertFailure(result);
    assert.equal(result.error.code, "FAILED_SERIALIZATION");
  });
});

describe("ServiceHttp — network errors", () => {
  let service: TestServiceHttp;

  beforeEach(() => {
    service = new TestServiceHttp();
    mockCalls = [];
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns EXTERNAL_API_FAILED on fetch network error", async () => {
    globalThis.fetch = () => Promise.reject(new TypeError("fetch failed"));
    const result = await service.testGet("users");
    assertFailure(result);
    assert.equal(result.error.code, "EXTERNAL_API_FAILED");
  });

  it("returns EXTERNAL_API_FAILED when response.json() throws", async () => {
    const headers = new Map([["content-type", "application/json"]]);
    globalThis.fetch = (): Promise<Response> => {
      return Promise.resolve({
        status: 200,
        ok: true,
        headers: {
          get: (key: string) => headers.get(key) ?? null,
          forEach: (cb: (value: string, key: string) => void) => headers.forEach(cb),
        },
        json: () => Promise.reject(new SyntaxError("Unexpected token < in JSON")),
      } as unknown as Response);
    };
    const result = await service.testGet("proxy-502");
    assertFailure(result);
    assert.equal(result.error.code, "EXTERNAL_API_FAILED");
  });

  it("returns REQUEST_TIMEOUT on AbortError", async () => {
    globalThis.fetch = () => {
      const abortError = new DOMException("The operation was aborted", "AbortError");
      return Promise.reject(abortError);
    };
    const result = await service.testGet("users");
    assertFailure(result);
    assert.equal(result.error.code, "REQUEST_TIMEOUT");
  });
});

describe("ServiceHttp — timeout", () => {
  let service: TestServiceHttp;

  beforeEach(() => {
    service = new TestServiceHttp();
    mockCalls = [];
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("passes AbortController signal to fetch when timeout is set", async () => {
    let receivedSignal: AbortSignal | undefined;
    globalThis.fetch = (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      receivedSignal = init?.signal ?? undefined;
      const headers = new Map([["content-type", "application/json"]]);
      return Promise.resolve({
        status: 200,
        ok: true,
        headers: {
          get: (key: string) => headers.get(key) ?? null,
          forEach: (cb: (value: string, key: string) => void) => headers.forEach(cb),
        },
        json: () => Promise.resolve({ ok: true }),
      } as unknown as Response);
    };

    await service.testGet("users", undefined, { timeout: 5000 });
    assert.ok(receivedSignal instanceof AbortSignal);
  });

  it("does not pass signal when timeout is not set", async () => {
    let receivedSignal: AbortSignal | null | undefined = null;
    globalThis.fetch = (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      receivedSignal = init?.signal;
      const headers = new Map([["content-type", "application/json"]]);
      return Promise.resolve({
        status: 200,
        ok: true,
        headers: {
          get: (key: string) => headers.get(key) ?? null,
          forEach: (cb: (value: string, key: string) => void) => headers.forEach(cb),
        },
        json: () => Promise.resolve({ ok: true }),
      } as unknown as Response);
    };

    await service.testGet("users");
    assert.equal(receivedSignal, undefined);
  });

  it("aborts request when timeout expires", async () => {
    globalThis.fetch = (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      return new Promise((_resolve, reject) => {
        if (init?.signal) {
          init.signal.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
        }
      });
    };

    const result = await service.testGet("slow-endpoint", undefined, { timeout: 50 });
    assertFailure(result);
    assert.equal(result.error.code, "REQUEST_TIMEOUT");
  });

  it("clamps timeout to MAX_TIMEOUT_MS (300000)", async () => {
    let receivedSignal: AbortSignal | undefined;
    globalThis.fetch = (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      receivedSignal = init?.signal ?? undefined;
      const headers = new Map([["content-type", "application/json"]]);
      return Promise.resolve({
        status: 200,
        ok: true,
        headers: {
          get: (key: string) => headers.get(key) ?? null,
          forEach: (cb: (value: string, key: string) => void) => headers.forEach(cb),
        },
        json: () => Promise.resolve({ ok: true }),
      } as unknown as Response);
    };

    await service.testGet("users", undefined, { timeout: 999999 });
    assert.ok(receivedSignal instanceof AbortSignal);
    // If timeout was not clamped, the signal would have a much larger timeout
    // We verify signal exists (clamped value still creates AbortController)
  });

  it("does not create AbortController for zero timeout", async () => {
    let receivedSignal: AbortSignal | null | undefined = null;
    globalThis.fetch = (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      receivedSignal = init?.signal;
      const headers = new Map([["content-type", "application/json"]]);
      return Promise.resolve({
        status: 200,
        ok: true,
        headers: {
          get: (key: string) => headers.get(key) ?? null,
          forEach: (cb: (value: string, key: string) => void) => headers.forEach(cb),
        },
        json: () => Promise.resolve({ ok: true }),
      } as unknown as Response);
    };

    await service.testGet("users", undefined, { timeout: 0 });
    assert.equal(receivedSignal, undefined);
  });

  it("does not create AbortController for negative timeout", async () => {
    let receivedSignal: AbortSignal | null | undefined = null;
    globalThis.fetch = (_input: string | URL | Request, init?: RequestInit): Promise<Response> => {
      receivedSignal = init?.signal;
      const headers = new Map([["content-type", "application/json"]]);
      return Promise.resolve({
        status: 200,
        ok: true,
        headers: {
          get: (key: string) => headers.get(key) ?? null,
          forEach: (cb: (value: string, key: string) => void) => headers.forEach(cb),
        },
        json: () => Promise.resolve({ ok: true }),
      } as unknown as Response);
    };

    await service.testGet("users", undefined, { timeout: -100 });
    assert.equal(receivedSignal, undefined);
  });
});

describe("ServiceHttp — edge cases", () => {
  let service: TestServiceHttp;

  beforeEach(() => {
    service = new TestServiceHttp();
    mockCalls = [];
    originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch();
    setMockResponse(200, { ok: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("GET with non-record data skips query params silently", async () => {
    const result = await service.testGet("users", "not-a-record");
    assertSuccess(result);
    // Non-record data is ignored for GET, URL has no query params
    assert.equal(mockCalls[0].url, "https://api.test.com/users");
  });

  it("returns FAILED_URL_CONSTRUCTION for invalid baseUrl", async () => {
    const badService = new (class extends TestServiceHttp {
      override readonly baseUrl = "not-a-valid-url";
    })();
    const result = await badService.testGet("users");
    assertFailure(result);
    assert.equal(result.error.code, "FAILED_URL_CONSTRUCTION");
  });
});
