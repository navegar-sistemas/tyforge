import { Result, ok, err, isFailure } from "tyforge/result";
import { Exceptions } from "tyforge/exceptions";
import { ServiceBase } from "tyforge/infrastructure/service-base";
import { TypeGuard } from "tyforge/tools";
import { FString, FInt } from "tyforge/type-fields";
import { ServiceWebSocketSecurity } from "./service-websocket.security";
import { ExceptionWebSocket } from "./exception-websocket";
import type { IWebSocketOptions, TWebSocketHandler, TWebSocketResult } from "./service-websocket.types";

const MAX_TIMEOUT_MS = 300000;
const DEFAULT_RECONNECT_ATTEMPTS = 3;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_MESSAGE_BYTES = 10485760;
const MAX_RECONNECT_DELAY_MS = 30000;

interface ISubscriptionEntry {
  event: FString;
  handler: TWebSocketHandler;
}

export abstract class ServiceWebSocket extends ServiceBase {

  protected override async validateEndpointDns(): Promise<boolean> {
    const { ToolNetworkSecurity } = await import("tyforge/tools/network-security");
    const parsed = new URL(this.endpoint.getValue());
    const result = await ToolNetworkSecurity.resolveAndValidate(parsed.hostname);
    return result.valid;
  }

  private socket: WebSocket | null = null;
  private subscriptions: Map<string, ISubscriptionEntry> = new Map();
  private subscriptionCounter = 0;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = DEFAULT_RECONNECT_ATTEMPTS;
  private shouldReconnect = false;
  private connectionOptions: IWebSocketOptions | undefined;

  protected connect(options?: IWebSocketOptions): TWebSocketResult<FString> {
    return this.executeConnect(options);
  }

  protected disconnect(): TWebSocketResult<void> {
    return this.executeDisconnect();
  }

  protected send(event: FString, data: Record<string, unknown>): TWebSocketResult<void> {
    return this.executeSend(event, data);
  }

  protected subscribe(event: FString, handler: TWebSocketHandler): Result<FString, Exceptions> {
    return this.executeSubscribe(event, handler);
  }

  protected unsubscribe(subscriptionId: FString): Result<void, Exceptions> {
    return this.executeUnsubscribe(subscriptionId);
  }

  private async executeConnect(options?: IWebSocketOptions): TWebSocketResult<FString> {
    if (options?.timeout !== undefined) {
      const timeoutMs = options.timeout.getValue();
      if (timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS) {
        return err(ExceptionWebSocket.invalidParams(`Timeout must be between 1 and ${MAX_TIMEOUT_MS} ms.`));
      }
    }

    if (options?.maxReconnectAttempts !== undefined) {
      const maxAttempts = options.maxReconnectAttempts.getValue();
      if (maxAttempts < 0) {
        return err(ExceptionWebSocket.invalidParams("Max reconnect attempts must be a non-negative integer."));
      }
      this.maxReconnectAttempts = maxAttempts;
    }

    this.shouldReconnect = options?.reconnect?.getValue() ?? false;
    this.connectionOptions = options;
    this.reconnectAttempts = 0;

    return this.establishConnection(options);
  }

  private async establishConnection(options?: IWebSocketOptions): TWebSocketResult<FString> {
    let authHeaders: Record<string, FString> = {};
    if (options?.authenticated?.getValue() ?? false) {
      const authResult = await this.getAuthHeaders();
      if (isFailure(authResult)) return err(ExceptionWebSocket.authFailed(authResult.error));
      authHeaders = authResult.value;
    }

    const mergedHeaders = ServiceWebSocketSecurity.sanitizeHeaders({
      ...authHeaders,
      ...(options?.headers ?? {}),
    });

    const wsUrl = this.buildWsUrl();

    // DNS rebinding protection
    const dnsValid = await this.validateEndpointDns();
    if (!dnsValid) {
      return err(ExceptionWebSocket.connectionFailed());
    }

    const headerEntries = Object.entries(mergedHeaders);
    const headerRecord: Record<string, string> = {};
    for (const [key, value] of headerEntries) {
      headerRecord[key] = value.getValue();
    }

    return this.createSocket(wsUrl, headerRecord, options?.timeout);
  }

  private createSocket(
    url: string,
    headers: Record<string, string>,
    timeout?: FInt,
  ): TWebSocketResult<FString> {
    return new Promise((resolve) => {
      try {
        // Node.js (>=22) WebSocket supports { headers } in constructor options.
        // Reflect.construct avoids type cast since lib.dom.d.ts lacks the Node.js signature.
        const constructorArgs: unknown[] = Object.keys(headers).length > 0
          ? [url, { headers }]
          : [url];
        this.socket = Reflect.construct(WebSocket, constructorArgs);
        this.attachSocketHandlers(resolve, timeout);
      } catch {
        resolve(err(ExceptionWebSocket.connectionFailed()));
      }
    });
  }

  private attachSocketHandlers(
    resolve: (result: Result<FString, Exceptions>) => void,
    timeout?: FInt,
  ): void {
    if (this.socket === null) {
      resolve(err(ExceptionWebSocket.connectionFailed()));
      return;
    }

    let settled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    if (timeout !== undefined) {
      timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          this.socket?.close();
          this.socket = null;
          resolve(err(ExceptionWebSocket.connectionTimeout()));
        }
      }, timeout.getValue());
    }

    this.socket.onopen = () => {
      if (!settled) {
        settled = true;
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        this.reconnectAttempts = 0;
        resolve(ok(FString.createOrThrow("connected")));
      }
    };

    this.socket.onerror = () => {
      if (!settled) {
        settled = true;
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        this.socket = null;
        resolve(err(ExceptionWebSocket.connectionFailed()));
      }
    };

    this.socket.onclose = () => {
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    };

    this.socket.onmessage = (messageEvent: MessageEvent) => {
      this.handleIncomingMessage(messageEvent);
    };
  }

  private handleIncomingMessage(messageEvent: MessageEvent): void {
    try {
      const raw = String(messageEvent.data);
      if (raw.length > MAX_MESSAGE_BYTES) return;
      const parsed: unknown = JSON.parse(raw);
      if (!TypeGuard.isRecord(parsed)) return;

      const eventName = parsed["event"];
      if (typeof eventName !== "string") return;

      const rawData = parsed["data"];
      const data: Record<string, unknown> = TypeGuard.isRecord(rawData) ? rawData : {};

      const sanitizeResult = ServiceWebSocketSecurity.sanitizeMessage(data);
      if (!sanitizeResult.success) return;

      for (const entry of this.subscriptions.values()) {
        if (entry.event.getValue() === eventName) {
          entry.handler(sanitizeResult.value);
        }
      }
    } catch {
      // Unparseable messages are silently dropped — consistent with WebSocket spec behavior
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const baseDelay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts - 1),
      MAX_RECONNECT_DELAY_MS,
    );
    // Jitter: randomize between 50-100% of base delay to prevent thundering herd
    const delay = Math.floor(baseDelay * (0.5 + Math.random() * 0.5));

    setTimeout(() => {
      this.establishConnection(this.connectionOptions).catch(() => {
        // Reconnect failed — will retry via onclose if attempts remain
      });
    }, delay);
  }

  private buildWsUrl(): string {
    const origin = this.endpoint.getValue();
    if (origin.startsWith("https://")) {
      return `wss://${origin.substring(8)}`;
    }
    // http://localhost or http://127.0.0.1 (development)
    return `ws://${origin.substring(7)}`;
  }

  private async executeDisconnect(): TWebSocketResult<void> {
    this.shouldReconnect = false;
    this.connectionOptions = undefined;

    if (this.socket === null) {
      return ok(undefined);
    }

    return new Promise((resolve) => {
      if (this.socket === null) {
        resolve(ok(undefined));
        return;
      }

      const previousOnClose = this.socket.onclose;
      this.socket.onclose = () => {
        this.socket = null;
        this.subscriptions.clear();
        this.subscriptionCounter = 0;
        this.reconnectAttempts = 0;
        resolve(ok(undefined));
      };

      try {
        this.socket.close();
      } catch {
        this.socket.onclose = previousOnClose;
        this.socket = null;
        this.subscriptions.clear();
        resolve(ok(undefined));
      }
    });
  }

  private async executeSend(event: FString, data: Record<string, unknown>): TWebSocketResult<void> {
    if (this.socket === null || this.socket.readyState !== WebSocket.OPEN) {
      return err(ExceptionWebSocket.sendFailed(event.getValue()));
    }

    const sanitizeResult = ServiceWebSocketSecurity.sanitizeMessage(data);
    if (!sanitizeResult.success) return err(ExceptionWebSocket.invalidMessage());

    try {
      const payload = JSON.stringify({
        event: event.getValue(),
        data: sanitizeResult.value,
      });
      this.socket.send(payload);
      return ok(undefined);
    } catch {
      return err(ExceptionWebSocket.sendFailed(event.getValue()));
    }
  }

  private executeSubscribe(event: FString, handler: TWebSocketHandler): Result<FString, Exceptions> {
    if (this.socket === null) {
      return err(ExceptionWebSocket.subscriptionFailed(event.getValue()));
    }

    this.subscriptionCounter++;
    const subscriptionId = FString.createOrThrow(`sub_${this.subscriptionCounter}`);

    this.subscriptions.set(subscriptionId.getValue(), { event, handler });

    return ok(subscriptionId);
  }

  private executeUnsubscribe(subscriptionId: FString): Result<void, Exceptions> {
    const id = subscriptionId.getValue();
    if (!this.subscriptions.has(id)) {
      return err(ExceptionWebSocket.invalidParams(`Subscription "${id}" not found.`));
    }

    this.subscriptions.delete(id);
    return ok(undefined);
  }
}
