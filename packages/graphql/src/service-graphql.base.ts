import { GraphQLClient, ClientError } from "graphql-request";
import { ok, err, isFailure } from "tyforge/result";
import { ServiceBase } from "tyforge/infrastructure/service-base";
import { ToolHeaderSecurity } from "tyforge/tools";
import { FString, FGraphQLOperationName } from "tyforge/type-fields";
import { ServiceGraphQLSecurity } from "./service-graphql.security";
import { ExceptionGraphQL } from "./exception-graphql";
import { DtoGraphQLRequest } from "./dto-graphql-request";
import type { IGraphQLError, TGraphQLResult } from "./service-graphql.types";

const OPERATION_NAME_REGEX = /(?:query|mutation|subscription)\s+(\w+)/;
const MAX_TIMEOUT_MS = 300000;

export abstract class ServiceGraphQL extends ServiceBase {

  protected query(dto: DtoGraphQLRequest): TGraphQLResult<unknown> {
    return this.execute("query", dto);
  }

  protected mutation(dto: DtoGraphQLRequest): TGraphQLResult<unknown> {
    return this.execute("mutation", dto);
  }

  private async execute(
    operationType: "query" | "mutation",
    dto: DtoGraphQLRequest,
  ): TGraphQLResult<unknown> {
    if (ServiceGraphQLSecurity.isIntrospectionQuery(dto.query)) {
      return err(ExceptionGraphQL.unsafeQuery());
    }

    let sanitizedVars: Record<string, unknown> | undefined;
    if (dto.variables !== undefined) {
      const sanitizeResult = ServiceGraphQLSecurity.sanitizeVariables(dto.variables.getValue());
      if (isFailure(sanitizeResult)) return err(sanitizeResult.error);
      sanitizedVars = sanitizeResult.value;
    }

    const operationName = dto.operationName !== undefined
      ? dto.operationName
      : this.extractOperationName(dto.query);

    let authHeaders: Record<string, FString> = {};
    if (dto.authenticated?.getValue() ?? false) {
      const authResult = await this.getAuthHeaders();
      if (isFailure(authResult)) return err(ExceptionGraphQL.unauthorized(authResult.error));
      authHeaders = authResult.value;
    }

    const mergedHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(authHeaders)) {
      mergedHeaders[key] = value.getValue();
    }
    if (dto.headers) {
      for (const [key, value] of Object.entries(dto.headers)) {
        mergedHeaders[key] = value.getValue();
      }
    }
    const sanitizedHeaders = ToolHeaderSecurity.sanitizeHeaders(mergedHeaders);

    const timeoutMs = dto.timeout?.getValue();
    if (timeoutMs !== undefined && (timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS)) {
      return err(ExceptionGraphQL.invalidParams(`Timeout must be between 1 and ${MAX_TIMEOUT_MS} ms.`));
    }

    const dnsValid = await this.validateEndpointDns();
    if (!dnsValid) {
      return err(ExceptionGraphQL.networkError());
    }

    const controller = timeoutMs !== undefined ? new AbortController() : undefined;
    const timeoutId = controller !== undefined
      ? setTimeout(() => controller.abort(), timeoutMs)
      : undefined;

    try {
      const client = new GraphQLClient(this.endpoint.getValue(), {
        headers: sanitizedHeaders,
        signal: controller?.signal,
        fetch: (input, init) => fetch(input, { ...init, redirect: "error" }),
      });

      const data = await client.request({
        document: dto.query.getValue(),
        variables: sanitizedVars,
        requestHeaders: sanitizedHeaders,
      });

      if (data === null || data === undefined) {
        return err(ExceptionGraphQL.invalidResponse(operationName.getValue()));
      }

      return ok(data);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return err(ExceptionGraphQL.timeout(operationName.getValue()));
      }

      if (e instanceof ClientError) {
        const errors: IGraphQLError[] = (e.response.errors ?? [])
          .filter((gqlErr) => typeof gqlErr.message === "string")
          .map((gqlErr) => ({
            message: gqlErr.message,
            locations: gqlErr.locations as IGraphQLError["locations"],
            path: gqlErr.path as IGraphQLError["path"],
            extensions: gqlErr.extensions as Record<string, unknown> | undefined,
          }));

        if (errors.length > 0) {
          const isUnauth = errors.some((err) =>
            (err.extensions && err.extensions["code"] === "UNAUTHENTICATED") ||
            err.message === "UNAUTHENTICATED",
          );
          if (isUnauth) return err(ExceptionGraphQL.unauthorized());

          return operationType === "query"
            ? err(ExceptionGraphQL.queryFailed(operationName.getValue(), errors))
            : err(ExceptionGraphQL.mutationFailed(operationName.getValue(), errors));
        }

        if (e.response.status >= 500) {
          return err(ExceptionGraphQL.networkError());
        }

        return err(ExceptionGraphQL.invalidResponse(operationName.getValue()));
      }

      return err(ExceptionGraphQL.networkError());
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }

  private extractOperationName(document: { getValue(): string }): FGraphQLOperationName {
    const match = OPERATION_NAME_REGEX.exec(document.getValue());
    return FGraphQLOperationName.createOrThrow(match !== null ? match[1] : "Anonymous");
  }
}
