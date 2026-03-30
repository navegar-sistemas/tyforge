import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { ServiceHttpSecurity } from "../service-http.security";
import { isSuccess, isFailure } from "tyforge/result";
import { FString, FUrlOrigin, FUrlPath } from "tyforge/type-fields";

// ── Helpers ────────────────────────────────────────────────────

function headersFromRecord(record: Record<string, string>): Record<string, FString> {
  const result: Record<string, FString> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key] = FString.createOrThrow(value, key);
  }
  return result;
}

function headersToRecord(headers: Record<string, FString>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = value.getValue();
  }
  return result;
}

function forigin(value: string): FUrlOrigin {
  return FUrlOrigin.createOrThrow(value);
}

function fpath(value: string): FUrlPath {
  return FUrlPath.createOrThrow(value);
}

// ── FUrlPath validation (replaces isValidRelativePath) ──────────

describe("FUrlPath — path validation", () => {
  it("accepts valid relative paths", () => {
    assert.ok(isSuccess(FUrlPath.create("users")));
    assert.ok(isSuccess(FUrlPath.create("api/v1/users")));
    assert.ok(isSuccess(FUrlPath.create("/api/v1/users")));
    assert.ok(isSuccess(FUrlPath.create("users/123/profile")));
  });

  it("rejects absolute URLs with protocol", () => {
    assert.ok(isFailure(FUrlPath.create("http://evil.com/api")));
    assert.ok(isFailure(FUrlPath.create("https://evil.com")));
    assert.ok(isFailure(FUrlPath.create("ftp://evil.com")));
  });

  it("rejects protocol-relative URLs", () => {
    assert.ok(isFailure(FUrlPath.create("//evil.com/api")));
  });

  it("rejects path traversal with dot-dot", () => {
    assert.ok(isFailure(FUrlPath.create("../etc/passwd")));
    assert.ok(isFailure(FUrlPath.create("users/../../admin")));
    assert.ok(isFailure(FUrlPath.create("..\\windows\\system32")));
    assert.ok(isFailure(FUrlPath.create("foo/..")));
  });

  it("rejects paths with CRLF characters", () => {
    assert.ok(isFailure(FUrlPath.create("users\r\ninjected")));
    assert.ok(isFailure(FUrlPath.create("path\nheader")));
    assert.ok(isFailure(FUrlPath.create("path\rheader")));
  });

  it("rejects paths with null bytes", () => {
    assert.ok(isFailure(FUrlPath.create("users\0admin")));
    assert.ok(isFailure(FUrlPath.create("\0")));
  });

  it("allows paths with dots that are not traversal", () => {
    assert.ok(isSuccess(FUrlPath.create("file.json")));
    assert.ok(isSuccess(FUrlPath.create("api/v1.2/data")));
    assert.ok(isSuccess(FUrlPath.create(".hidden")));
  });
});

// ── sanitizeHeaders ─────────────────────────────────────────────

describe("ServiceHttpSecurity — sanitizeHeaders", () => {
  it("passes clean headers unchanged", () => {
    const headers = headersFromRecord({ "Content-Type": "application/json", "Authorization": "Bearer token123" });
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["Content-Type"].getValue(), "application/json");
    assert.equal(result["Authorization"].getValue(), "Bearer token123");
  });

  it("sanitizes CRLF in header values", () => {
    const headers = headersFromRecord({ "X-Test": "value\r\nInjected: evil\r\nAnother: attack" });
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["X-Test"].getValue(), "valueInjected: evilAnother: attack");
  });

  it("sanitizes single \\r in header values", () => {
    const headers = headersFromRecord({ "X-Test": "value\revil" });
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["X-Test"].getValue(), "valueevil");
  });

  it("sanitizes single \\n in header values", () => {
    const headers = headersFromRecord({ "X-Test": "value\nevil" });
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["X-Test"].getValue(), "valueevil");
  });

  it("sanitizes header keys with CRLF", () => {
    const headers = headersFromRecord({ "X-Custom\r\nInjected": "value" });
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["X-CustomInjected"].getValue(), "value");
    assert.equal(result["X-Custom\r\nInjected"], undefined);
  });

  it("sanitizes both keys and values simultaneously", () => {
    const headers = headersFromRecord({ "Key\nEvil": "Value\r\nEvil" });
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["KeyEvil"].getValue(), "ValueEvil");
  });

  it("handles empty headers", () => {
    const result = ServiceHttpSecurity.sanitizeHeaders({});
    assert.deepEqual(headersToRecord(result), {});
  });

  it("sanitizes null bytes in header values", () => {
    const headers = headersFromRecord({ "X-Test": "value\0injected" });
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["X-Test"].getValue(), "valueinjected");
  });

  it("sanitizes null bytes in header keys", () => {
    const headers = headersFromRecord({ "X-Test\0Evil": "value" });
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["X-TestEvil"].getValue(), "value");
    assert.equal(result["X-Test\0Evil"], undefined);
  });

  it("skips __proto__ keys (prototype pollution)", () => {
    const headers = headersFromRecord({ "__proto__": "polluted", "X-Safe": "ok" });
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(Object.hasOwn(result, "__proto__"), false);
    assert.equal(result["X-Safe"].getValue(), "ok");
  });

  it("skips constructor keys (prototype pollution)", () => {
    const headers = headersFromRecord({ "constructor": "polluted", "X-Safe": "ok" });
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(Object.hasOwn(result, "constructor"), false);
    assert.equal(result["X-Safe"].getValue(), "ok");
  });

  it("skips prototype keys (prototype pollution)", () => {
    const headers = headersFromRecord({ "prototype": "polluted", "X-Safe": "ok" });
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(Object.hasOwn(result, "prototype"), false);
    assert.equal(result["X-Safe"].getValue(), "ok");
  });

  it("drops keys that become empty after sanitization", () => {
    const headers = headersFromRecord({ "\r\n": "value" });
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.deepEqual(headersToRecord(result), {});
  });
});

// ── buildUrl ────────────────────────────────────────────────────

describe("ServiceHttpSecurity — buildUrl", () => {
  it("builds URL from base and endpoint", () => {
    const result = ServiceHttpSecurity.buildUrl(forigin("https://api.example.com"), fpath("users"));
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), "https://api.example.com/users");
  });

  it("handles base URL with trailing slash", () => {
    const result = ServiceHttpSecurity.buildUrl(forigin("https://api.example.com/"), fpath("users"));
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), "https://api.example.com/users");
  });

  it("handles endpoint with leading slash", () => {
    const result = ServiceHttpSecurity.buildUrl(forigin("https://api.example.com"), fpath("/users"));
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), "https://api.example.com/users");
  });

  it("handles both trailing and leading slashes", () => {
    const result = ServiceHttpSecurity.buildUrl(forigin("https://api.example.com/"), fpath("/users"));
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), "https://api.example.com/users");
  });

  it("handles nested endpoint paths", () => {
    const result = ServiceHttpSecurity.buildUrl(forigin("https://api.example.com/v1"), fpath("users/123/profile"));
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), "https://api.example.com/v1/users/123/profile");
  });

  it("rejects path traversal endpoint at TypeField level", () => {
    assert.ok(isFailure(FUrlPath.create("../admin")));
  });

  it("rejects absolute URL endpoint at TypeField level", () => {
    assert.ok(isFailure(FUrlPath.create("https://evil.com")));
  });

  it("rejects CRLF injection endpoint at TypeField level", () => {
    assert.ok(isFailure(FUrlPath.create("users\r\nX-Injected: evil")));
  });

  it("rejects invalid base URL at TypeField level", () => {
    assert.ok(isFailure(FUrlOrigin.create("not-a-url")));
  });

  it("handles base URL with path and trailing slash", () => {
    const result = ServiceHttpSecurity.buildUrl(forigin("https://api.example.com/v1/"), fpath("users/123"));
    assert.ok(isSuccess(result));
    assert.equal(result.value.getValue(), "https://api.example.com/v1/users/123");
  });
});
