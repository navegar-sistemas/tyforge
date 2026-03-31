import { Exceptions } from "tyforge/exceptions";
import { OHttpStatus } from "tyforge";
import type { THttpStatus } from "tyforge";

export interface IExternalError {
  status?: number;
  data?: unknown;
}

export class ExceptionHttp extends Exceptions {
  readonly typeInference = "ExceptionHttp";
  readonly externalError?: IExternalError;

  protected constructor(
    details: {
      type: string;
      title: string;
      detail: string;
      status: THttpStatus;
      code: string;
      retriable: boolean;
    },
    externalError?: IExternalError,
  ) {
    super({
      ...details,
      instance: "ServiceHttp",
      uri: "",
    });
    Object.defineProperty(this, "externalError", {
      value: externalError,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }

  static unsafeEndpoint(): ExceptionHttp {
    return new ExceptionHttp({
      type: "http/unsafe-endpoint",
      title: "Unsafe Endpoint",
      detail:
        "Endpoint contains path traversal, absolute URL, or CRLF characters.",
      status: OHttpStatus.BAD_REQUEST,
      code: "UNSAFE_ENDPOINT",
      retriable: false,
    });
  }

  static failedUrlConstruction(): ExceptionHttp {
    return new ExceptionHttp({
      type: "http/failed-url-construction",
      title: "Failed URL Construction",
      detail: "Could not construct a valid URL from the base URL and endpoint.",
      status: OHttpStatus.BAD_REQUEST,
      code: "FAILED_URL_CONSTRUCTION",
      retriable: false,
    });
  }

  static failedSerialization(): ExceptionHttp {
    return new ExceptionHttp({
      type: "http/failed-serialization",
      title: "Failed Serialization",
      detail: "Could not serialize request body to the specified format.",
      status: OHttpStatus.BAD_REQUEST,
      code: "FAILED_SERIALIZATION",
      retriable: false,
    });
  }

  static externalApiFailed(externalError?: IExternalError): ExceptionHttp {
    return new ExceptionHttp(
      {
        type: "http/external-api-failed",
        title: "External API Failed",
        detail: externalError?.status
          ? `External API returned status ${externalError.status}.`
          : "External API request failed.",
        status: OHttpStatus.BAD_GATEWAY,
        code: "EXTERNAL_API_FAILED",
        retriable: true,
      },
      externalError,
    );
  }

  static authFailed(cause?: Exceptions): ExceptionHttp {
    const exception = new ExceptionHttp({
      type: "http/auth-failed",
      title: "Authentication Failed",
      detail: "Could not obtain authentication headers for the request.",
      status: OHttpStatus.UNAUTHORIZED,
      code: "AUTH_FAILED",
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

  static invalidParams(detail: string): ExceptionHttp {
    return new ExceptionHttp({
      type: "http/invalid-params",
      title: "Invalid Request Parameters",
      detail,
      status: OHttpStatus.BAD_REQUEST,
      code: "INVALID_PARAMS",
      retriable: false,
    });
  }

  static timeout(): ExceptionHttp {
    return new ExceptionHttp({
      type: "http/timeout",
      title: "Request Timeout",
      detail:
        "The external service did not respond within the configured timeout.",
      status: OHttpStatus.GATEWAY_TIMEOUT,
      code: "REQUEST_TIMEOUT",
      retriable: true,
    });
  }
}
