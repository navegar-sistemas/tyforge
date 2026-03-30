import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { isSuccess, isFailure } from "tyforge/result";
import { ServiceWebSocketSecurity } from "../service-websocket.security";
import { FString } from "tyforge/type-fields";

describe("ServiceWebSocketSecurity — sanitizeMessage", () => {
  it("passes through safe keys and values", () => {
    const data = { name: "test", age: 25, active: true };
    const result = ServiceWebSocketSecurity.sanitizeMessage(data);
    assert.ok(isSuccess(result));
    assert.deepEqual(result.value, { name: "test", age: 25, active: true });
  });

  it("strips __proto__ key from message data", () => {
    const data = Object.create(null) as Record<string, unknown>;
    data["name"] = "test";
    data["__proto__"] = { polluted: true };
    const result = ServiceWebSocketSecurity.sanitizeMessage(data);
    assert.ok(isSuccess(result));
    assert.equal(result.value["name"], "test");
    assert.equal(Object.hasOwn(result.value, "__proto__"), false);
    assert.equal(Object.keys(result.value).length, 1);
  });

  it("strips constructor key from message data", () => {
    const data = { name: "test", "constructor": { polluted: true } };
    const result = ServiceWebSocketSecurity.sanitizeMessage(data);
    assert.ok(isSuccess(result));
    assert.equal(result.value["name"], "test");
    assert.equal(Object.keys(result.value).length, 1);
  });

  it("strips prototype key from message data", () => {
    const data = { name: "test", "prototype": { polluted: true } };
    const result = ServiceWebSocketSecurity.sanitizeMessage(data);
    assert.ok(isSuccess(result));
    assert.equal(result.value["name"], "test");
    assert.equal(Object.keys(result.value).length, 1);
  });

  it("recursively sanitizes nested objects", () => {
    const nested = Object.create(null) as Record<string, unknown>;
    nested["name"] = "test";
    nested["__proto__"] = { admin: true };
    const data = { user: nested };
    const result = ServiceWebSocketSecurity.sanitizeMessage(data);
    assert.ok(isSuccess(result));
    const user = result.value["user"] as Record<string, unknown>;
    assert.equal(user["name"], "test");
    assert.equal(Object.hasOwn(user, "__proto__"), false);
    assert.equal(Object.keys(user).length, 1);
  });

  it("recursively sanitizes arrays of objects", () => {
    const itemA = Object.create(null) as Record<string, unknown>;
    itemA["name"] = "a";
    itemA["__proto__"] = { evil: true };
    const itemB = Object.create(null) as Record<string, unknown>;
    itemB["name"] = "b";
    itemB["constructor"] = { evil: true };
    const data = { items: [itemA, itemB] };
    const result = ServiceWebSocketSecurity.sanitizeMessage(data);
    assert.ok(isSuccess(result));
    const items = result.value["items"] as Record<string, unknown>[];
    assert.equal(items.length, 2);
    assert.equal(items[0]["name"], "a");
    assert.equal(Object.hasOwn(items[0], "__proto__"), false);
    assert.equal(items[1]["name"], "b");
    assert.equal(Object.hasOwn(items[1], "constructor"), false);
  });

  it("preserves primitive array items unchanged", () => {
    const data = { tags: ["alpha", "beta", 42, true] };
    const result = ServiceWebSocketSecurity.sanitizeMessage(data);
    assert.ok(isSuccess(result));
    assert.deepEqual(result.value["tags"], ["alpha", "beta", 42, true]);
  });

  it("handles empty object", () => {
    const result = ServiceWebSocketSecurity.sanitizeMessage({});
    assert.ok(isSuccess(result));
    assert.deepEqual(result.value, {});
  });

  it("handles deeply nested pollution attempts", () => {
    const innermost = Object.create(null) as Record<string, unknown>;
    innermost["__proto__"] = { d: true };
    innermost["safe"] = "value";
    const data = { a: { b: { c: innermost } } };
    const result = ServiceWebSocketSecurity.sanitizeMessage(data);
    assert.ok(isSuccess(result));
    const nested = (result.value["a"] as Record<string, unknown>)["b"] as Record<string, unknown>;
    const deep = nested["c"] as Record<string, unknown>;
    assert.equal(deep["safe"], "value");
    assert.equal(Object.hasOwn(deep, "__proto__"), false);
    assert.equal(Object.keys(deep).length, 1);
  });

  it("returns error when nesting exceeds maximum depth", () => {
    let data: Record<string, unknown> = { value: "leaf" };
    for (let i = 0; i < 51; i++) {
      data = { nested: data };
    }
    const result = ServiceWebSocketSecurity.sanitizeMessage(data);
    assert.ok(isFailure(result));
    assert.equal(result.error.code, "WS_INVALID_MESSAGE");
  });
});

describe("ServiceWebSocketSecurity — sanitizeHeaders", () => {
  it("passes through safe headers", () => {
    const headers = {
      "Authorization": FString.createOrThrow("Bearer token123"),
      "X-Custom": FString.createOrThrow("value"),
    };
    const result = ServiceWebSocketSecurity.sanitizeHeaders(headers);
    assert.equal(result["Authorization"].getValue(), "Bearer token123");
    assert.equal(result["X-Custom"].getValue(), "value");
  });

  it("strips CRLF characters from header values", () => {
    const headers = {
      "X-Header": FString.createOrThrow("value\r\nInjected: evil"),
    };
    const result = ServiceWebSocketSecurity.sanitizeHeaders(headers);
    assert.equal(result["X-Header"].getValue(), "valueInjected: evil");
  });

  it("strips dangerous keys from headers", () => {
    const headers = Object.create(null) as Record<string, FString>;
    headers["Authorization"] = FString.createOrThrow("Bearer token");
    headers["__proto__"] = FString.createOrThrow("polluted");
    const result = ServiceWebSocketSecurity.sanitizeHeaders(headers);
    assert.equal(result["Authorization"].getValue(), "Bearer token");
    assert.equal(Object.hasOwn(result, "__proto__"), false);
  });

  it("handles empty headers", () => {
    const result = ServiceWebSocketSecurity.sanitizeHeaders({});
    assert.deepEqual(result, {});
  });
});
