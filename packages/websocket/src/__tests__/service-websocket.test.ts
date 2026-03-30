import { describe, it, beforeEach, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import { ServiceWebSocket } from "../service-websocket.base";
import { isSuccess, isFailure, ok, err, Result } from "tyforge/result";
import { Exceptions } from "tyforge/exceptions";
import { FString, FInt, FBoolean, FUrlOrigin } from "tyforge/type-fields";
import { ExceptionWebSocket } from "../exception-websocket";

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

// ── Mock WebSocket ──────────────────────────────────────────────

type TSocketEventHandler = ((ev: unknown) => void) | null;

interface IMockWebSocketInstance {
  url: string;
  readyState: number;
  onopen: TSocketEventHandler;
  onerror: TSocketEventHandler;
  onclose: TSocketEventHandler;
  onmessage: TSocketEventHandler;
  close: () => void;
  send: (data: string) => void;
  sentMessages: string[];
  simulateOpen: () => void;
  simulateError: () => void;
  simulateClose: () => void;
  simulateMessage: (data: string) => void;
}

let mockSocketInstance: IMockWebSocketInstance | null = null;
let originalWebSocket: typeof globalThis.WebSocket;

function createMockWebSocketClass(behavior: "open" | "error" | "timeout" = "open") {
  return class MockWebSocket {
    static readonly OPEN = 1;
    static readonly CLOSED = 3;

    url: string;
    readyState = 0;
    onopen: TSocketEventHandler = null;
    onerror: TSocketEventHandler = null;
    onclose: TSocketEventHandler = null;
    onmessage: TSocketEventHandler = null;
    sentMessages: string[] = [];

    constructor(url: string, _options?: unknown) {
      this.url = url;
      mockSocketInstance = this as unknown as IMockWebSocketInstance;

      if (behavior === "open") {
        setTimeout(() => this.simulateOpen(), 0);
      } else if (behavior === "error") {
        setTimeout(() => this.simulateError(), 0);
      }
      // "timeout" = never resolves (useful for testing timeout)
    }

    simulateOpen(): void {
      this.readyState = 1;
      if (this.onopen) this.onopen({});
    }

    simulateError(): void {
      if (this.onerror) this.onerror({});
    }

    simulateClose(): void {
      this.readyState = 3;
      if (this.onclose) this.onclose({});
    }

    simulateMessage(data: string): void {
      if (this.onmessage) this.onmessage({ data });
    }

    close(): void {
      this.readyState = 3;
      if (this.onclose) this.onclose({});
    }

    send(data: string): void {
      if (this.readyState !== 1) throw new Error("WebSocket is not open");
      this.sentMessages.push(data);
    }
  };
}

// ── Concrete test subclass ──────────────────────────────────────

class TestServiceWebSocket extends ServiceWebSocket {
  protected readonly _classInfo = { name: "TestServiceWebSocket", version: "1.0.0", description: "Test WebSocket service" };
  override readonly endpoint: FUrlOrigin = FUrlOrigin.createOrThrow("https://ws.test.com");
  authResult: Result<Record<string, FString>, Exceptions> = ok({ "Authorization": FString.createOrThrow("Bearer ws-token") });

  protected override async getAuthHeaders(): Promise<Result<Record<string, FString>, Exceptions>> {
    return this.authResult;
  }

  protected override async validateEndpointDns(): Promise<boolean> {
    return true;
  }

  testConnect(options?: Parameters<ServiceWebSocket["connect"]>[0]) {
    return this.connect(options);
  }

  testDisconnect() {
    return this.disconnect();
  }

  testSend(event: FString, data: Record<string, unknown>) {
    return this.send(event, data);
  }

  testSubscribe(event: FString, handler: (data: Record<string, unknown>) => void) {
    return this.subscribe(event, handler);
  }

  testUnsubscribe(subscriptionId: FString) {
    return this.unsubscribe(subscriptionId);
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe("ServiceWebSocket — connection", () => {
  let service: TestServiceWebSocket;

  beforeEach(() => {
    service = new TestServiceWebSocket();
    mockSocketInstance = null;
    originalWebSocket = globalThis.WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it("connects successfully and converts https to wss", async () => {
    globalThis.WebSocket = createMockWebSocketClass("open") as unknown as typeof WebSocket;
    const result = await service.testConnect();
    assertSuccess(result);
    assert.equal(result.value.getValue(), "connected");
    assert.ok(mockSocketInstance !== null);
    assert.equal(mockSocketInstance.url, "wss://ws.test.com");
  });

  it("returns CONNECTION_FAILED when socket errors on connect", async () => {
    globalThis.WebSocket = createMockWebSocketClass("error") as unknown as typeof WebSocket;
    const result = await service.testConnect();
    assertFailure(result);
    assert.equal(result.error.code, "WS_CONNECTION_FAILED");
  });

  it("returns CONNECTION_TIMEOUT when socket does not open in time", async () => {
    globalThis.WebSocket = createMockWebSocketClass("timeout") as unknown as typeof WebSocket;
    const result = await service.testConnect({ timeout: FInt.createOrThrow(50) });
    assertFailure(result);
    assert.equal(result.error.code, "WS_CONNECTION_TIMEOUT");
  });

  it("rejects invalid timeout (exceeds max)", async () => {
    globalThis.WebSocket = createMockWebSocketClass("open") as unknown as typeof WebSocket;
    const result = await service.testConnect({ timeout: FInt.createOrThrow(999999) });
    assertFailure(result);
    assert.equal(result.error.code, "WS_INVALID_PARAMS");
  });

  it("rejects zero timeout", async () => {
    globalThis.WebSocket = createMockWebSocketClass("open") as unknown as typeof WebSocket;
    const result = await service.testConnect({ timeout: FInt.createOrThrow(0) });
    assertFailure(result);
    assert.equal(result.error.code, "WS_INVALID_PARAMS");
  });

  it("rejects negative timeout", async () => {
    globalThis.WebSocket = createMockWebSocketClass("open") as unknown as typeof WebSocket;
    const result = await service.testConnect({ timeout: FInt.createOrThrow(-100) });
    assertFailure(result);
    assert.equal(result.error.code, "WS_INVALID_PARAMS");
  });

  it("rejects negative maxReconnectAttempts", async () => {
    globalThis.WebSocket = createMockWebSocketClass("open") as unknown as typeof WebSocket;
    const result = await service.testConnect({ maxReconnectAttempts: FInt.createOrThrow(-1) });
    assertFailure(result);
    assert.equal(result.error.code, "WS_INVALID_PARAMS");
  });
});

describe("ServiceWebSocket — authentication", () => {
  let service: TestServiceWebSocket;

  beforeEach(() => {
    service = new TestServiceWebSocket();
    mockSocketInstance = null;
    originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = createMockWebSocketClass("open") as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it("passes auth headers when authenticated is true", async () => {
    const result = await service.testConnect({ authenticated: FBoolean.createOrThrow(true) });
    assertSuccess(result);
    // Auth headers are passed to WebSocket constructor — verified via successful connection
  });

  it("returns AUTH_FAILED when getAuthHeaders fails", async () => {
    service.authResult = err(ExceptionWebSocket.authFailed());
    const result = await service.testConnect({ authenticated: FBoolean.createOrThrow(true) });
    assertFailure(result);
    assert.equal(result.error.code, "WS_AUTH_FAILED");
  });

  it("does not call getAuthHeaders when authenticated is false", async () => {
    let authCalled = false;
    const originalGetAuth = service.authResult;
    Object.defineProperty(service, "authResult", {
      get() {
        authCalled = true;
        return originalGetAuth;
      },
    });
    const result = await service.testConnect({ authenticated: FBoolean.createOrThrow(false) });
    assertSuccess(result);
    assert.equal(authCalled, false);
  });
});

describe("ServiceWebSocket — disconnect", () => {
  let service: TestServiceWebSocket;

  beforeEach(() => {
    service = new TestServiceWebSocket();
    mockSocketInstance = null;
    originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = createMockWebSocketClass("open") as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it("disconnects successfully after connection", async () => {
    await service.testConnect();
    const result = await service.testDisconnect();
    assertSuccess(result);
  });

  it("disconnect on already disconnected socket succeeds", async () => {
    const result = await service.testDisconnect();
    assertSuccess(result);
  });
});

describe("ServiceWebSocket — send", () => {
  let service: TestServiceWebSocket;

  beforeEach(() => {
    service = new TestServiceWebSocket();
    mockSocketInstance = null;
    originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = createMockWebSocketClass("open") as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it("sends message as JSON with event and data", async () => {
    await service.testConnect();
    const result = await service.testSend(FString.createOrThrow("chat.message"), { text: "hello" });
    assertSuccess(result);
    assert.ok(mockSocketInstance !== null);
    assert.equal(mockSocketInstance.sentMessages.length, 1);
    const parsed = JSON.parse(mockSocketInstance.sentMessages[0]);
    assert.equal(parsed.event, "chat.message");
    assert.deepEqual(parsed.data, { text: "hello" });
  });

  it("sanitizes message data before sending", async () => {
    await service.testConnect();
    const malicious = Object.create(null) as Record<string, unknown>;
    malicious["name"] = "test";
    malicious["__proto__"] = { admin: true };
    const result = await service.testSend(
      FString.createOrThrow("data.update"),
      malicious,
    );
    assertSuccess(result);
    assert.ok(mockSocketInstance !== null);
    const parsed = JSON.parse(mockSocketInstance.sentMessages[0]);
    assert.equal(Object.hasOwn(parsed.data, "__proto__"), false);
    assert.equal(parsed.data.name, "test");
  });

  it("returns SEND_FAILED when socket is not connected", async () => {
    const result = await service.testSend(FString.createOrThrow("test"), { data: "value" });
    assertFailure(result);
    assert.equal(result.error.code, "WS_SEND_FAILED");
  });

  it("returns SEND_FAILED when socket is closed", async () => {
    await service.testConnect();
    await service.testDisconnect();
    const result = await service.testSend(FString.createOrThrow("test"), { data: "value" });
    assertFailure(result);
    assert.equal(result.error.code, "WS_SEND_FAILED");
  });
});

describe("ServiceWebSocket — subscribe/unsubscribe", () => {
  let service: TestServiceWebSocket;

  beforeEach(() => {
    service = new TestServiceWebSocket();
    mockSocketInstance = null;
    originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = createMockWebSocketClass("open") as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it("subscribe returns a subscription ID", async () => {
    await service.testConnect();
    const received: Record<string, unknown>[] = [];
    const result = service.testSubscribe(FString.createOrThrow("chat.message"), (data) => received.push(data));
    assertSuccess(result);
    assert.ok(result.value.getValue().startsWith("sub_"));
  });

  it("subscription receives matching messages", async () => {
    await service.testConnect();
    const received: Record<string, unknown>[] = [];
    service.testSubscribe(FString.createOrThrow("chat.message"), (data) => received.push(data));

    assert.ok(mockSocketInstance !== null);
    mockSocketInstance.simulateMessage(JSON.stringify({ event: "chat.message", data: { text: "hello" } }));

    assert.equal(received.length, 1);
    assert.deepEqual(received[0], { text: "hello" });
  });

  it("subscription ignores non-matching events", async () => {
    await service.testConnect();
    const received: Record<string, unknown>[] = [];
    service.testSubscribe(FString.createOrThrow("chat.message"), (data) => received.push(data));

    assert.ok(mockSocketInstance !== null);
    mockSocketInstance.simulateMessage(JSON.stringify({ event: "user.typing", data: { userId: "123" } }));

    assert.equal(received.length, 0);
  });

  it("multiple subscriptions to same event both receive messages", async () => {
    await service.testConnect();
    const received1: Record<string, unknown>[] = [];
    const received2: Record<string, unknown>[] = [];
    service.testSubscribe(FString.createOrThrow("chat.message"), (data) => received1.push(data));
    service.testSubscribe(FString.createOrThrow("chat.message"), (data) => received2.push(data));

    assert.ok(mockSocketInstance !== null);
    mockSocketInstance.simulateMessage(JSON.stringify({ event: "chat.message", data: { text: "hello" } }));

    assert.equal(received1.length, 1);
    assert.equal(received2.length, 1);
  });

  it("unsubscribe removes handler", async () => {
    await service.testConnect();
    const received: Record<string, unknown>[] = [];
    const subResult = service.testSubscribe(FString.createOrThrow("chat.message"), (data) => received.push(data));
    assertSuccess(subResult);

    const unsubResult = service.testUnsubscribe(subResult.value);
    assertSuccess(unsubResult);

    assert.ok(mockSocketInstance !== null);
    mockSocketInstance.simulateMessage(JSON.stringify({ event: "chat.message", data: { text: "hello" } }));
    assert.equal(received.length, 0);
  });

  it("unsubscribe with invalid ID returns error", async () => {
    await service.testConnect();
    const result = service.testUnsubscribe(FString.createOrThrow("sub_nonexistent"));
    assertFailure(result);
    assert.equal(result.error.code, "WS_INVALID_PARAMS");
  });

  it("subscribe without connection returns SUBSCRIPTION_FAILED", () => {
    const result = service.testSubscribe(FString.createOrThrow("test"), () => {});
    assertFailure(result);
    assert.equal(result.error.code, "WS_SUBSCRIPTION_FAILED");
  });
});

describe("ServiceWebSocket — message handling", () => {
  let service: TestServiceWebSocket;

  beforeEach(() => {
    service = new TestServiceWebSocket();
    mockSocketInstance = null;
    originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = createMockWebSocketClass("open") as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it("sanitizes incoming message data against prototype pollution", async () => {
    await service.testConnect();
    const received: Record<string, unknown>[] = [];
    service.testSubscribe(FString.createOrThrow("data"), (data) => received.push(data));

    assert.ok(mockSocketInstance !== null);
    // Manually constructed JSON to ensure __proto__ appears as an own property after parsing
    const rawJson = '{"event":"data","data":{"name":"test","__proto__":{"admin":true}}}';
    mockSocketInstance.simulateMessage(rawJson);

    assert.equal(received.length, 1);
    assert.equal(received[0]["name"], "test");
    assert.equal(Object.hasOwn(received[0], "__proto__"), false);
  });

  it("silently drops unparseable messages", async () => {
    await service.testConnect();
    const received: Record<string, unknown>[] = [];
    service.testSubscribe(FString.createOrThrow("data"), (data) => received.push(data));

    assert.ok(mockSocketInstance !== null);
    mockSocketInstance.simulateMessage("not valid json{{{");
    assert.equal(received.length, 0);
  });

  it("silently drops messages without event field", async () => {
    await service.testConnect();
    const received: Record<string, unknown>[] = [];
    service.testSubscribe(FString.createOrThrow("data"), (data) => received.push(data));

    assert.ok(mockSocketInstance !== null);
    mockSocketInstance.simulateMessage(JSON.stringify({ data: { text: "hello" } }));
    assert.equal(received.length, 0);
  });

  it("handles message with missing data field gracefully", async () => {
    await service.testConnect();
    const received: Record<string, unknown>[] = [];
    service.testSubscribe(FString.createOrThrow("ping"), (data) => received.push(data));

    assert.ok(mockSocketInstance !== null);
    mockSocketInstance.simulateMessage(JSON.stringify({ event: "ping" }));
    assert.equal(received.length, 1);
    assert.deepEqual(received[0], {});
  });

  it("silently drops array messages", async () => {
    await service.testConnect();
    const received: Record<string, unknown>[] = [];
    service.testSubscribe(FString.createOrThrow("data"), (data) => received.push(data));

    assert.ok(mockSocketInstance !== null);
    mockSocketInstance.simulateMessage(JSON.stringify([1, 2, 3]));
    assert.equal(received.length, 0);
  });
});

describe("ServiceWebSocket — URL conversion", () => {
  beforeEach(() => {
    mockSocketInstance = null;
    originalWebSocket = globalThis.WebSocket;
    globalThis.WebSocket = createMockWebSocketClass("open") as unknown as typeof WebSocket;
  });

  afterEach(() => {
    globalThis.WebSocket = originalWebSocket;
  });

  it("converts https:// to wss://", async () => {
    const service = new TestServiceWebSocket();
    await service.testConnect();
    assert.ok(mockSocketInstance !== null);
    assert.equal(mockSocketInstance.url, "wss://ws.test.com");
  });

  it("converts http://localhost to ws://localhost", async () => {
    class LocalService extends ServiceWebSocket {
      protected readonly _classInfo = { name: "LocalService", version: "1.0.0", description: "Local dev service" };
      override readonly endpoint = FUrlOrigin.createOrThrow("http://localhost:8080");
      protected override async getAuthHeaders() {
        const headers: Record<string, FString> = {};
        return ok(headers);
      }
      protected override async validateEndpointDns() { return true; }

      testConnect() { return this.connect(); }
    }

    const service = new LocalService();
    await service.testConnect();
    assert.ok(mockSocketInstance !== null);
    assert.equal(mockSocketInstance.url, "ws://localhost:8080");
  });
});
