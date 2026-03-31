import { ok, err, isFailure } from "tyforge/result";
import { ServiceBase } from "tyforge/infrastructure/service-base";
import { ToolNetworkSecurity } from "tyforge/tools/network-security";
import { TypeGuard, ToolHeaderSecurity } from "tyforge/tools";
import { FString, FGraphQLOperationName } from "tyforge/type-fields";
import { ServiceGraphQLSecurity } from "./service-graphql.security";
import { ExceptionGraphQL } from "./exception-graphql";
import { DtoGraphQLRequest } from "./dto-graphql-request";
import type { IGraphQLError, TGraphQLResult } from "./service-graphql.types";

// Captures the operation name (first identifier after query/mutation/subscription keyword)
const OPERATION_NAME_REGEX = /(?:query|mutation|subscription)\s+(\w+)/;
const MAX_TIMEOUT_MS = 300000;
const MAX_RESPONSE_BYTES = 10485760;

export abstract class ServiceGraphQL extends ServiceBase {

  protected override async validateEndpointDns(): Promise<boolean> {
    const parsed = new URL(this.endpoint.getValue());
    const result = await ToolNetworkSecurity.resolveAndValidate(parsed.hostname);
    return result.valid;
  }

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
      const rawVars = this.unwrapStringMap(dto.variables);
      const sanitizeResult = ServiceGraphQLSecurity.sanitizeVariables(rawVars);
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

    const mergedHeaders: Record<string, FString> = {
      "Content-Type": FString.createOrThrow("application/json;charset=UTF-8"),
      ...authHeaders,
      ...(dto.headers ?? {}),
    };

    const fetchHeaders: Record<string, string> = {};
    for (const [key, value] of Object.entries(mergedHeaders)) {
      fetchHeaders[key] = value.getValue();
    }
    const sanitizedHeaders = ToolHeaderSecurity.sanitizeHeaders(fetchHeaders);

    const body = JSON.stringify({
      query: dto.query.getValue(),
      variables: sanitizedVars,
      operationName: operationName.getValue() || undefined,
    });

    const timeoutMs = dto.timeout?.getValue();
    if (timeoutMs !== undefined && (timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS)) {
      return err(ExceptionGraphQL.invalidParams(`Timeout must be between 1 and ${MAX_TIMEOUT_MS} ms.`));
    }
    const controller = timeoutMs !== undefined ? new AbortController() : undefined;
    const timeoutId = controller !== undefined
      ? setTimeout(() => controller.abort(), timeoutMs)
      : undefined;

    // DNS rebinding protection
    const dnsValid = await this.validateEndpointDns();
    if (!dnsValid) {
      return err(ExceptionGraphQL.networkError());
    }

    try {
      const response = await fetch(this.endpoint.getValue(), {
        method: "POST",
        headers: sanitizedHeaders,
        body,
        signal: controller?.signal,
        redirect: "error",
      });

      if (!response.ok) {
        return err(ExceptionGraphQL.networkError());
      }

      const responseText = await response.text();
      if (responseText.length > MAX_RESPONSE_BYTES) {
        return err(ExceptionGraphQL.invalidResponse(operationName.getValue()));
      }

      const responseData: unknown = JSON.parse(responseText);

      if (!TypeGuard.isRecord(responseData)) {
        return err(ExceptionGraphQL.invalidResponse(operationName.getValue()));
      }

      const rawErrors = responseData["errors"];
      const errors: IGraphQLError[] = Array.isArray(rawErrors)
        ? rawErrors.filter((e): e is IGraphQLError => TypeGuard.isRecord(e) && typeof e["message"] === "string")
        : [];

      if (errors.length > 0) {
        const isUnauth = errors.some((e) =>
          (TypeGuard.isRecord(e["extensions"]) && e["extensions"]["code"] === "UNAUTHENTICATED") ||
          e["message"] === "UNAUTHENTICATED",
        );
        if (isUnauth) return err(ExceptionGraphQL.unauthorized());

        return operationType === "query"
          ? err(ExceptionGraphQL.queryFailed(operationName.getValue(), errors))
          : err(ExceptionGraphQL.mutationFailed(operationName.getValue(), errors));
      }

      const data: unknown = responseData["data"];
      if (data === undefined || data === null) {
        return err(ExceptionGraphQL.invalidResponse(operationName.getValue()));
      }

      return ok(data);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return err(ExceptionGraphQL.timeout(operationName.getValue()));
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

  private unwrapStringMap(map: Record<string, FString>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(map)) {
      result[key] = value.getValue();
    }
    return result;
  }
}
