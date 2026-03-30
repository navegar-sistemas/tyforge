import { Exceptions } from "tyforge/exceptions";
import { OHttpStatus } from "tyforge";
import type { THttpStatus } from "tyforge";

export class ExceptionWebSocket extends Exceptions {
  readonly typeInference = "ExceptionWebSocket";

  protected constructor(
    details: {
      type: string;
      title: string;
      detail: string;
      status: THttpStatus;
      code: string;
      retriable: boolean;
    },
  ) {
    super({
      ...details,
      instance: "ServiceWebSocket",
      uri: "",
    });
  }

  static connectionFailed(): ExceptionWebSocket {
    return new ExceptionWebSocket({
      type: "websocket/connection-failed",
      title: "WebSocket Connection Failed",
      detail: "Could not establish a WebSocket connection to the server.",
      status: OHttpStatus.BAD_GATEWAY,
      code: "WS_CONNECTION_FAILED",
      retriable: true,
    });
  }

  static connectionTimeout(): ExceptionWebSocket {
    return new ExceptionWebSocket({
      type: "websocket/connection-timeout",
      title: "WebSocket Connection Timeout",
      detail: "The WebSocket connection attempt timed out.",
      status: OHttpStatus.GATEWAY_TIMEOUT,
      code: "WS_CONNECTION_TIMEOUT",
      retriable: true,
    });
  }

  static disconnected(): ExceptionWebSocket {
    return new ExceptionWebSocket({
      type: "websocket/disconnected",
      title: "WebSocket Disconnected",
      detail: "The WebSocket connection was closed unexpectedly.",
      status: OHttpStatus.SERVICE_UNAVAILABLE,
      code: "WS_DISCONNECTED",
      retriable: true,
    });
  }

  static sendFailed(event: string): ExceptionWebSocket {
    return new ExceptionWebSocket({
      type: "websocket/send-failed",
      title: "WebSocket Send Failed",
      detail: `Failed to send message for event "${event}".`,
      status: OHttpStatus.BAD_GATEWAY,
      code: "WS_SEND_FAILED",
      retriable: true,
    });
  }

  static subscriptionFailed(event: string): ExceptionWebSocket {
    return new ExceptionWebSocket({
      type: "websocket/subscription-failed",
      title: "WebSocket Subscription Failed",
      detail: `Failed to subscribe to event "${event}".`,
      status: OHttpStatus.BAD_REQUEST,
      code: "WS_SUBSCRIPTION_FAILED",
      retriable: false,
    });
  }

  static authFailed(cause?: Exceptions): ExceptionWebSocket {
    const exception = new ExceptionWebSocket({
      type: "websocket/auth-failed",
      title: "WebSocket Authentication Failed",
      detail: "Could not obtain authentication headers for the WebSocket connection.",
      status: OHttpStatus.UNAUTHORIZED,
      code: "WS_AUTH_FAILED",
      retriable: false,
    });
    if (cause !== undefined) {
      Object.defineProperty(exception, "cause", {
        value: cause,
        enumerable: false,
        writable: false,
        configurable: false,
      });
    }
    return exception;
  }

  static invalidMessage(): ExceptionWebSocket {
    return new ExceptionWebSocket({
      type: "websocket/invalid-message",
      title: "WebSocket Invalid Message",
      detail: "Received a message that could not be parsed as valid JSON.",
      status: OHttpStatus.BAD_REQUEST,
      code: "WS_INVALID_MESSAGE",
      retriable: false,
    });
  }

  static invalidParams(detail: string): ExceptionWebSocket {
    return new ExceptionWebSocket({
      type: "websocket/invalid-params",
      title: "Invalid WebSocket Parameters",
      detail,
      status: OHttpStatus.BAD_REQUEST,
      code: "WS_INVALID_PARAMS",
      retriable: false,
    });
  }
}
