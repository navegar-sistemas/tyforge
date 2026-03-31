import { Exceptions } from "tyforge/exceptions";
import { OHttpStatus } from "tyforge";
import type { THttpStatus } from "tyforge";
import type { IGraphQLError } from "./service-graphql.types";

export class ExceptionGraphQL extends Exceptions {
  readonly typeInference = "ExceptionGraphQL";
  readonly graphqlErrors: IGraphQLError[] = [];
  readonly operationName: string = "";

  protected constructor(
    details: {
      type: string;
      title: string;
      detail: string;
      status: THttpStatus;
      code: string;
      retriable: boolean;
    },
    graphqlErrors: IGraphQLError[],
    operationName: string,
  ) {
    super({
      ...details,
      instance: "ServiceGraphQL",
      uri: "",
    });
    Object.defineProperty(this, "graphqlErrors", {
      value: graphqlErrors,
      enumerable: false,
      writable: false,
      configurable: false,
    });
    Object.defineProperty(this, "operationName", {
      value: operationName,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }

  static queryFailed(
    operationName: string,
    errors: IGraphQLError[],
  ): ExceptionGraphQL {
    return new ExceptionGraphQL(
      {
        type: "graphql/query-failed",
        title: "GraphQL Query Failed",
        detail: `Query "${operationName}" returned errors.`,
        status: OHttpStatus.BAD_GATEWAY,
        code: "GRAPHQL_QUERY_FAILED",
        retriable: false,
      },
      errors,
      operationName,
    );
  }

  static mutationFailed(
    operationName: string,
    errors: IGraphQLError[],
  ): ExceptionGraphQL {
    return new ExceptionGraphQL(
      {
        type: "graphql/mutation-failed",
        title: "GraphQL Mutation Failed",
        detail: `Mutation "${operationName}" returned errors.`,
        status: OHttpStatus.BAD_GATEWAY,
        code: "GRAPHQL_MUTATION_FAILED",
        retriable: false,
      },
      errors,
      operationName,
    );
  }

  static networkError(cause?: Exceptions): ExceptionGraphQL {
    const exception = new ExceptionGraphQL(
      {
        type: "graphql/network-error",
        title: "GraphQL Network Error",
        detail: "Could not reach the GraphQL endpoint.",
        status: OHttpStatus.BAD_GATEWAY,
        code: "GRAPHQL_NETWORK_ERROR",
        retriable: true,
      },
      [],
      "",
    );
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

  static unauthorized(cause?: Exceptions): ExceptionGraphQL {
    const exception = new ExceptionGraphQL(
      {
        type: "graphql/unauthorized",
        title: "GraphQL Unauthorized",
        detail: "The GraphQL server returned an UNAUTHENTICATED error.",
        status: OHttpStatus.UNAUTHORIZED,
        code: "GRAPHQL_UNAUTHORIZED",
        retriable: false,
      },
      [],
      "",
    );
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

  static timeout(operationName: string): ExceptionGraphQL {
    return new ExceptionGraphQL(
      {
        type: "graphql/timeout",
        title: "GraphQL Timeout",
        detail: `Operation "${operationName}" timed out.`,
        status: OHttpStatus.GATEWAY_TIMEOUT,
        code: "GRAPHQL_TIMEOUT",
        retriable: true,
      },
      [],
      operationName,
    );
  }

  static invalidResponse(operationName: string): ExceptionGraphQL {
    return new ExceptionGraphQL(
      {
        type: "graphql/invalid-response",
        title: "GraphQL Invalid Response",
        detail: `Operation "${operationName}" returned null data without errors.`,
        status: OHttpStatus.BAD_GATEWAY,
        code: "GRAPHQL_INVALID_RESPONSE",
        retriable: false,
      },
      [],
      operationName,
    );
  }

  static invalidParams(detail: string): ExceptionGraphQL {
    return new ExceptionGraphQL(
      {
        type: "graphql/invalid-params",
        title: "Invalid GraphQL Parameters",
        detail,
        status: OHttpStatus.BAD_REQUEST,
        code: "GRAPHQL_INVALID_PARAMS",
        retriable: false,
      },
      [],
      "",
    );
  }

  static unsafeQuery(): ExceptionGraphQL {
    return new ExceptionGraphQL(
      {
        type: "graphql/unsafe-query",
        title: "GraphQL Unsafe Query",
        detail: "Introspection queries are not allowed.",
        status: OHttpStatus.BAD_REQUEST,
        code: "GRAPHQL_UNSAFE_QUERY",
        retriable: false,
      },
      [],
      "",
    );
  }
}
