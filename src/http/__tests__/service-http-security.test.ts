import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { ServiceHttpSecurity } from "@tyforge/http/service-http.security";
import { isSuccess, isFailure } from "@tyforge/result/result";

// ── isValidRelativePath ─────────────────────────────────────────

describe("ServiceHttpSecurity — isValidRelativePath", () => {
  it("accepts valid relative paths", () => {
    assert.equal(ServiceHttpSecurity.isValidRelativePath("users"), true);
    assert.equal(ServiceHttpSecurity.isValidRelativePath("api/v1/users"), true);
    assert.equal(ServiceHttpSecurity.isValidRelativePath("/api/v1/users"), true);
    assert.equal(ServiceHttpSecurity.isValidRelativePath("users/123/profile"), true);
  });

  it("rejects empty path", () => {
    assert.equal(ServiceHttpSecurity.isValidRelativePath(""), false);
  });

  it("rejects absolute URLs with protocol", () => {
    assert.equal(ServiceHttpSecurity.isValidRelativePath("http://evil.com/api"), false);
    assert.equal(ServiceHttpSecurity.isValidRelativePath("https://evil.com"), false);
    assert.equal(ServiceHttpSecurity.isValidRelativePath("ftp://evil.com"), false);
  });

  it("rejects protocol-relative URLs", () => {
    assert.equal(ServiceHttpSecurity.isValidRelativePath("//evil.com/api"), false);
  });

  it("rejects path traversal with dot-dot", () => {
    assert.equal(ServiceHttpSecurity.isValidRelativePath("../etc/passwd"), false);
    assert.equal(ServiceHttpSecurity.isValidRelativePath("users/../../admin"), false);
    assert.equal(ServiceHttpSecurity.isValidRelativePath("..\\windows\\system32"), false);
    assert.equal(ServiceHttpSecurity.isValidRelativePath("foo/.."), false);
  });

  it("rejects paths with CRLF characters", () => {
    assert.equal(ServiceHttpSecurity.isValidRelativePath("users\r\ninjected"), false);
    assert.equal(ServiceHttpSecurity.isValidRelativePath("path\nheader"), false);
    assert.equal(ServiceHttpSecurity.isValidRelativePath("path\rheader"), false);
  });

  it("rejects paths with null bytes", () => {
    assert.equal(ServiceHttpSecurity.isValidRelativePath("users\0admin"), false);
    assert.equal(ServiceHttpSecurity.isValidRelativePath("\0"), false);
  });

  it("allows paths with dots that are not traversal", () => {
    assert.equal(ServiceHttpSecurity.isValidRelativePath("file.json"), true);
    assert.equal(ServiceHttpSecurity.isValidRelativePath("api/v1.2/data"), true);
    assert.equal(ServiceHttpSecurity.isValidRelativePath(".hidden"), true);
  });
});

// ── sanitizeHeaders ─────────────────────────────────────────────

describe("ServiceHttpSecurity — sanitizeHeaders", () => {
  it("passes clean headers unchanged", () => {
    const headers = { "Content-Type": "application/json", "Authorization": "Bearer token123" };
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["Content-Type"], "application/json");
    assert.equal(result["Authorization"], "Bearer token123");
  });

  it("removes all CRLF from header values (not just the first)", () => {
    const headers = { "X-Test": "value\r\nInjected: evil\r\nAnother: attack" };
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["X-Test"], "valueInjected: evilAnother: attack");
  });

  it("removes single \\r from header values", () => {
    const headers = { "X-Test": "value\revil" };
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["X-Test"], "valueevil");
  });

  it("removes single \\n from header values", () => {
    const headers = { "X-Test": "value\nevil" };
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["X-Test"], "valueevil");
  });

  it("sanitizes header keys with CRLF", () => {
    const headers = { "X-Custom\r\nInjected": "value" };
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["X-CustomInjected"], "value");
    assert.equal(result["X-Custom\r\nInjected"], undefined);
  });

  it("sanitizes both keys and values simultaneously", () => {
    const headers = { "Key\nEvil": "Value\r\nEvil" };
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["KeyEvil"], "ValueEvil");
  });

  it("handles empty headers object", () => {
    const result = ServiceHttpSecurity.sanitizeHeaders({});
    assert.deepEqual(result, {});
  });

  it("removes null bytes from header values", () => {
    const headers = { "X-Test": "value\0injected" };
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["X-Test"], "valueinjected");
  });

  it("removes null bytes from header keys", () => {
    const headers = { "X-Test\0Evil": "value" };
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(result["X-TestEvil"], "value");
    assert.equal(result["X-Test\0Evil"], undefined);
  });

  it("skips __proto__ keys (prototype pollution)", () => {
    const headers = { "__proto__": "polluted", "X-Safe": "ok" };
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(Object.hasOwn(result, "__proto__"), false);
    assert.equal(result["X-Safe"], "ok");
  });

  it("skips constructor keys (prototype pollution)", () => {
    const headers = { "constructor": "polluted", "X-Safe": "ok" };
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(Object.hasOwn(result, "constructor"), false);
    assert.equal(result["X-Safe"], "ok");
  });

  it("skips prototype keys (prototype pollution)", () => {
    const headers = { "prototype": "polluted", "X-Safe": "ok" };
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(Object.hasOwn(result, "prototype"), false);
    assert.equal(result["X-Safe"], "ok");
  });

  it("skips keys that become empty after sanitization", () => {
    const headers = { "\r\n": "value" };
    const result = ServiceHttpSecurity.sanitizeHeaders(headers);
    assert.equal(Object.keys(result).length, 0);
  });
});

// ── buildUrl ────────────────────────────────────────────────────

describe("ServiceHttpSecurity — buildUrl", () => {
  it("builds URL from base and endpoint", () => {
    const result = ServiceHttpSecurity.buildUrl("https://api.example.com", "users");
    assert.ok(isSuccess(result));
    assert.equal(result.value, "https://api.example.com/users");
  });

  it("handles base URL with trailing slash", () => {
    const result = ServiceHttpSecurity.buildUrl("https://api.example.com/", "users");
    assert.ok(isSuccess(result));
    assert.equal(result.value, "https://api.example.com/users");
  });

  it("handles endpoint with leading slash", () => {
    const result = ServiceHttpSecurity.buildUrl("https://api.example.com", "/users");
    assert.ok(isSuccess(result));
    assert.equal(result.value, "https://api.example.com/users");
  });

  it("handles both trailing and leading slashes", () => {
    const result = ServiceHttpSecurity.buildUrl("https://api.example.com/", "/users");
    assert.ok(isSuccess(result));
    assert.equal(result.value, "https://api.example.com/users");
  });

  it("handles nested endpoint paths", () => {
    const result = ServiceHttpSecurity.buildUrl("https://api.example.com/v1", "users/123/profile");
    assert.ok(isSuccess(result));
    assert.equal(result.value, "https://api.example.com/v1/users/123/profile");
  });

  it("returns error for path traversal endpoint", () => {
    const result = ServiceHttpSecurity.buildUrl("https://api.example.com", "../admin");
    assert.ok(isFailure(result));
  });

  it("returns error for absolute URL endpoint", () => {
    const result = ServiceHttpSecurity.buildUrl("https://api.example.com", "https://evil.com");
    assert.ok(isFailure(result));
  });

  it("returns error for CRLF injection endpoint", () => {
    const result = ServiceHttpSecurity.buildUrl("https://api.example.com", "users\r\nX-Injected: evil");
    assert.ok(isFailure(result));
  });

  it("returns error for empty endpoint", () => {
    const result = ServiceHttpSecurity.buildUrl("https://api.example.com", "");
    assert.ok(isFailure(result));
  });

  it("returns error for invalid base URL", () => {
    const result = ServiceHttpSecurity.buildUrl("not-a-url", "users");
    assert.ok(isFailure(result));
  });

  it("handles base URL with path and trailing slash", () => {
    const result = ServiceHttpSecurity.buildUrl("https://api.example.com/v1/", "users/123");
    assert.ok(isSuccess(result));
    assert.equal(result.value, "https://api.example.com/v1/users/123");
  });
});
