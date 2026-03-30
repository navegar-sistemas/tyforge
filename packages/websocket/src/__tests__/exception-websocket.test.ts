import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { ExceptionWebSocket } from "../exception-websocket";
import { Exceptions } from "tyforge/exceptions";
import { OHttpStatus } from "tyforge";

describe("ExceptionWebSocket — factory methods", () => {
  it("connectionFailed returns correct exception", () => {
    const ex = ExceptionWebSocket.connectionFailed();
    assert.ok(ex instanceof ExceptionWebSocket);
    assert.ok(ex instanceof Exceptions);
    assert.equal(ex.code, "WS_CONNECTION_FAILED");
    assert.equal(ex.status, OHttpStatus.BAD_GATEWAY);
    assert.equal(ex.typeInference, "ExceptionWebSocket");
  });

  it("connectionTimeout returns correct exception", () => {
    const ex = ExceptionWebSocket.connectionTimeout();
    assert.ok(ex instanceof ExceptionWebSocket);
    assert.equal(ex.code, "WS_CONNECTION_TIMEOUT");
    assert.equal(ex.status, OHttpStatus.GATEWAY_TIMEOUT);
  });

  it("disconnected returns correct exception", () => {
    const ex = ExceptionWebSocket.disconnected();
    assert.ok(ex instanceof ExceptionWebSocket);
    assert.equal(ex.code, "WS_DISCONNECTED");
    assert.equal(ex.status, OHttpStatus.SERVICE_UNAVAILABLE);
  });

  it("sendFailed includes event name in detail", () => {
    const ex = ExceptionWebSocket.sendFailed("user.typing");
    assert.ok(ex instanceof ExceptionWebSocket);
    assert.equal(ex.code, "WS_SEND_FAILED");
    assert.equal(ex.status, OHttpStatus.BAD_GATEWAY);
    assert.ok(ex.detail.includes("user.typing"));
  });

  it("subscriptionFailed includes event name in detail", () => {
    const ex = ExceptionWebSocket.subscriptionFailed("chat.message");
    assert.ok(ex instanceof ExceptionWebSocket);
    assert.equal(ex.code, "WS_SUBSCRIPTION_FAILED");
    assert.equal(ex.status, OHttpStatus.BAD_REQUEST);
    assert.ok(ex.detail.includes("chat.message"));
  });

  it("authFailed returns correct exception", () => {
    const ex = ExceptionWebSocket.authFailed();
    assert.ok(ex instanceof ExceptionWebSocket);
    assert.equal(ex.code, "WS_AUTH_FAILED");
    assert.equal(ex.status, OHttpStatus.UNAUTHORIZED);
  });

  it("authFailed preserves cause as non-enumerable", () => {
    const cause = ExceptionWebSocket.connectionFailed();
    const ex = ExceptionWebSocket.authFailed(cause);
    assert.equal(ex.cause, cause);
    const serialized = JSON.stringify(ex);
    assert.equal(serialized.includes("WS_CONNECTION_FAILED"), false);
  });

  it("invalidMessage returns correct exception", () => {
    const ex = ExceptionWebSocket.invalidMessage();
    assert.ok(ex instanceof ExceptionWebSocket);
    assert.equal(ex.code, "WS_INVALID_MESSAGE");
    assert.equal(ex.status, OHttpStatus.BAD_REQUEST);
  });

  it("invalidParams includes custom detail", () => {
    const ex = ExceptionWebSocket.invalidParams("Timeout must be positive.");
    assert.ok(ex instanceof ExceptionWebSocket);
    assert.equal(ex.code, "WS_INVALID_PARAMS");
    assert.equal(ex.status, OHttpStatus.BAD_REQUEST);
    assert.equal(ex.detail, "Timeout must be positive.");
  });
});

describe("ExceptionWebSocket — retriable", () => {
  it("connectionFailed is retriable", () => {
    assert.equal(ExceptionWebSocket.connectionFailed().retriable, true);
  });

  it("connectionTimeout is retriable", () => {
    assert.equal(ExceptionWebSocket.connectionTimeout().retriable, true);
  });

  it("disconnected is retriable", () => {
    assert.equal(ExceptionWebSocket.disconnected().retriable, true);
  });

  it("sendFailed is retriable", () => {
    assert.equal(ExceptionWebSocket.sendFailed("test").retriable, true);
  });

  it("subscriptionFailed is not retriable", () => {
    assert.equal(ExceptionWebSocket.subscriptionFailed("test").retriable, false);
  });

  it("authFailed is not retriable", () => {
    assert.equal(ExceptionWebSocket.authFailed().retriable, false);
  });

  it("invalidMessage is not retriable", () => {
    assert.equal(ExceptionWebSocket.invalidMessage().retriable, false);
  });

  it("invalidParams is not retriable", () => {
    assert.equal(ExceptionWebSocket.invalidParams("test").retriable, false);
  });
});

describe("ExceptionWebSocket — serialization", () => {
  it("toJSON produces RFC 7807 compliant output", () => {
    const ex = ExceptionWebSocket.connectionFailed();
    const json = ex.toJSON();
    assert.equal(json.type, "websocket/connection-failed");
    assert.equal(json.title, "WebSocket Connection Failed");
    assert.equal(json.status, OHttpStatus.BAD_GATEWAY);
    assert.equal(json.code, "WS_CONNECTION_FAILED");
    assert.equal(json.instance, "ServiceWebSocket");
    assert.equal(typeof json.detail, "string");
  });
});
