import { describe, it, beforeEach, afterEach } from "node:test";
import { strict as assert } from "node:assert";
import { ServiceGraphQL } from "../service-graphql.base";
import { ExceptionGraphQL } from "../exception-graphql";
import { DtoGraphQLRequest } from "../dto-graphql-request";
import { isSuccess, isFailure, ok, err, Result } from "tyforge/result";
import { Exceptions, ExceptionValidation } from "tyforge/exceptions";
import { FString, FUrlOrigin } from "tyforge/type-fields";

// -- Helpers ---------------------------------------------------------

function assertSuccess<T, E>(
  result: Result<T, E>,
): asserts result is { success: true; value: T } {
  if (!isSuccess(result)) {
    assert.fail(
      `Expected success but got failure: ${JSON.stringify(result.error)}`,
    );
  }
}

function assertFailure<T, E>(
  result: Result<T, E>,
): asserts result is { success: false; error: E } {
  if (!isFailure(result)) {
    assert.fail(`Expected failure but got success`);
  }
}

// -- Test subclass ---------------------------------------------------

class TestServiceGraphQL extends ServiceGraphQL {
  protected readonly _classInfo = {
    name: "TestServiceGraphQL",
    version: "1.0.0",
    description: "Test GraphQL service",
  };
  override readonly endpoint: FUrlOrigin = FUrlOrigin.createOrThrow(
    "https://api.test.com/graphql",
  );
  authResult: Result<Record<string, FString>, Exceptions> = ok({
    Authorization: FString.createOrThrow("Bearer test-token"),
  });

  protected override async getAuthHeaders(): Promise<
    Result<Record<string, FString>, Exceptions>
  > {
    return this.authResult;
  }

  protected override async validateEndpointDns(): Promise<boolean> {
    return true;
  }

  testQuery(dto: DtoGraphQLRequest) {
    return this.query(dto);
  }

  testMutation(dto: DtoGraphQLRequest) {
    return this.mutation(dto);
  }
}

/** Helper to build a DtoGraphQLRequest from raw primitives */
function dto(
  query: string,
  vars?: Record<string, string>,
  extra?: {
    operationName?: string;
    timeout?: number;
    authenticated?: boolean;
    headers?: Record<string, string>;
  },
): DtoGraphQLRequest {
  const result = DtoGraphQLRequest.create({
    query,
    variables: vars,
    operationName: extra?.operationName,
    timeout: extra?.timeout,
    authenticated: extra?.authenticated,
    headers: extra?.headers,
  });
  if (!result.success) throw result.error;
  return result.value;
}

// -- Mock fetch infrastructure ---------------------------------------

interface IMockFetchCall {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | undefined;
}

let mockCalls: IMockFetchCall[] = [];
let mockResponseBody: Record<string, unknown> | string;
let mockResponseStatus: number;
let originalFetch: typeof globalThis.fetch;

function setMockGraphQLResponse(data: unknown, errors?: unknown[]) {
  mockResponseBody = { data, errors };
  mockResponseStatus = 200;
}

function setMockNetworkError(status: number) {
  mockResponseBody = "Server Error";
  mockResponseStatus = status;
}

function extractHeaders(init?: RequestInit): Record<string, string> {
  const raw = init?.headers;
  if (raw === undefined || raw === null) return {};
  const result: Record<string, string> = {};
  if (raw instanceof Headers) {
    raw.forEach((v, k) => {
      result[k] = v;
    });
  } else if (Array.isArray(raw)) {
    for (const pair of raw) {
      result[pair[0]] = pair[1];
    }
  } else {
    Object.assign(result, raw);
  }
  return result;
}

function createMockFetch(): typeof globalThis.fetch {
  return (
    input: string | URL | Request,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = typeof input === "string" ? input : input.toString();
    const body =
      init?.body !== undefined && init?.body !== null
        ? String(init.body)
        : undefined;
    mockCalls.push({
      url,
      method: init?.method ?? "GET",
      headers: extractHeaders(init),
      body,
    });

    let responseBody: string;
    let contentType: string;
    if (typeof mockResponseBody === "string") {
      responseBody = mockResponseBody;
      contentType = "text/plain";
    } else {
      responseBody = JSON.stringify(mockResponseBody);
      contentType = "application/json";
    }

    return Promise.resolve(
      new Response(responseBody, {
        status: mockResponseStatus,
        headers: { "content-type": contentType },
      }),
    );
  };
}

// -- Tests -----------------------------------------------------------

describe("ServiceGraphQL -- query", () => {
  let service: TestServiceGraphQL;

  beforeEach(() => {
    service = new TestServiceGraphQL();
    mockCalls = [];
    originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends query and returns data", async () => {
    setMockGraphQLResponse({ users: [{ id: 1, name: "Maria" }] });
    const result = await service.testQuery(
      dto("query GetUsers { users { id name } }"),
    );
    assertSuccess(result);
    const data = result.value as Record<string, unknown>;
    const users = data["users"] as Array<Record<string, unknown>>;
    assert.equal(users.length, 1);
    assert.equal(users[0]["name"], "Maria");
    assert.equal(mockCalls.length, 1);
    assert.equal(mockCalls[0].url, "https://api.test.com/graphql");
    assert.equal(mockCalls[0].method, "POST");
  });

  it("sends variables in request body", async () => {
    setMockGraphQLResponse({ user: { id: 1 } });
    await service.testQuery(
      dto("query GetUser($id: ID!) { user(id: $id) { id } }", {
        id: "1",
      }),
    );
    const body = JSON.parse(mockCalls[0].body ?? "{}");
    assert.equal(body.variables.id, "1");
    assert.ok(typeof body.query === "string");
    assert.ok(body.query.includes("GetUser"));
  });

  it("extracts operationName from document for error handling", async () => {
    setMockGraphQLResponse(null, [{ message: "Error" }]);
    const result = await service.testQuery(
      dto("query GetUsers { users { id } }"),
    );
    assertFailure(result);
    const gqlError = result.error as ExceptionGraphQL;
    assert.equal(gqlError.operationName, "GetUsers");
  });

  it("uses custom operationName in errors over auto-extraction", async () => {
    setMockGraphQLResponse(null, [{ message: "Error" }]);
    const result = await service.testQuery(
      dto("query GetUsers { users { id } }", undefined, {
        operationName: "CustomOp",
      }),
    );
    assertFailure(result);
    const gqlError = result.error as ExceptionGraphQL;
    assert.equal(gqlError.operationName, "CustomOp");
  });
});

describe("ServiceGraphQL -- mutation", () => {
  let service: TestServiceGraphQL;

  beforeEach(() => {
    service = new TestServiceGraphQL();
    mockCalls = [];
    originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("sends mutation and returns data", async () => {
    setMockGraphQLResponse({
      createUser: { id: 1, name: "Maria" },
    });
    const result = await service.testMutation(
      dto(
        "mutation CreateUser($input: UserInput!) { createUser(input: $input) { id name } }",
        { input: "Maria" },
      ),
    );
    assertSuccess(result);
    const data = result.value as Record<string, unknown>;
    const createUser = data["createUser"] as Record<string, unknown>;
    assert.equal(createUser["name"], "Maria");
  });
});

describe("ServiceGraphQL -- error handling", () => {
  let service: TestServiceGraphQL;

  beforeEach(() => {
    service = new TestServiceGraphQL();
    mockCalls = [];
    originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("returns queryFailed when graphql errors are present", async () => {
    setMockGraphQLResponse(null, [{ message: "Field not found" }]);
    const result = await service.testQuery(
      dto("query GetUsers { users { id } }"),
    );
    assertFailure(result);
    assert.equal(result.error.code, "GRAPHQL_QUERY_FAILED");
    const gqlError = result.error as ExceptionGraphQL;
    assert.equal(gqlError.graphqlErrors.length, 1);
    assert.equal(gqlError.operationName, "GetUsers");
  });

  it("returns mutationFailed when mutation has graphql errors", async () => {
    setMockGraphQLResponse(null, [{ message: "Validation error" }]);
    const result = await service.testMutation(
      dto("mutation CreateUser { createUser { id } }"),
    );
    assertFailure(result);
    assert.equal(result.error.code, "GRAPHQL_MUTATION_FAILED");
  });

  it("detects UNAUTHENTICATED via extensions.code", async () => {
    setMockGraphQLResponse(null, [
      {
        message: "Not authorized",
        extensions: { code: "UNAUTHENTICATED" },
      },
    ]);
    const result = await service.testQuery(dto("query GetMe { me { id } }"));
    assertFailure(result);
    assert.equal(result.error.code, "GRAPHQL_UNAUTHORIZED");
  });

  it("detects UNAUTHENTICATED via message", async () => {
    setMockGraphQLResponse(null, [{ message: "UNAUTHENTICATED" }]);
    const result = await service.testQuery(dto("query GetMe { me { id } }"));
    assertFailure(result);
    assert.equal(result.error.code, "GRAPHQL_UNAUTHORIZED");
  });

  it("returns invalidResponse when data is null without errors", async () => {
    setMockGraphQLResponse(null);
    const result = await service.testQuery(
      dto("query GetData { data { id } }"),
    );
    assertFailure(result);
    assert.equal(result.error.code, "GRAPHQL_INVALID_RESPONSE");
  });

  it("returns networkError on HTTP 5xx status", async () => {
    setMockNetworkError(500);
    const result = await service.testQuery(
      dto("query GetData { data { id } }"),
    );
    assertFailure(result);
    assert.equal(result.error.code, "GRAPHQL_NETWORK_ERROR");
  });

  it("returns networkError on fetch failure", async () => {
    globalThis.fetch = () => Promise.reject(new TypeError("fetch failed"));
    const result = await service.testQuery(
      dto("query GetData { data { id } }"),
    );
    assertFailure(result);
    assert.equal(result.error.code, "GRAPHQL_NETWORK_ERROR");
    assert.equal(result.error.retriable, true);
  });

  it("returns timeout on AbortError", async () => {
    globalThis.fetch = (
      _input: string | URL | Request,
      init?: RequestInit,
    ): Promise<Response> => {
      return new Promise((_resolve, reject) => {
        if (init?.signal) {
          init.signal.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted", "AbortError"));
          });
        }
      });
    };

    const result = await service.testQuery(
      dto("query SlowQuery { data { id } }", undefined, {
        timeout: 50,
      }),
    );
    assertFailure(result);
    assert.equal(result.error.code, "GRAPHQL_TIMEOUT");
    assert.equal(result.error.retriable, true);
  });
});

describe("ServiceGraphQL -- authentication", () => {
  let service: TestServiceGraphQL;

  beforeEach(() => {
    service = new TestServiceGraphQL();
    mockCalls = [];
    originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch();
    setMockGraphQLResponse({ ok: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("includes auth headers when authenticated", async () => {
    await service.testQuery(
      dto("query Q { q }", undefined, {
        authenticated: true,
      }),
    );
    assert.equal(mockCalls[0].headers["authorization"], "Bearer test-token");
  });

  it("does not include auth headers by default", async () => {
    await service.testQuery(dto("query Q { q }"));
    assert.equal(mockCalls[0].headers["authorization"], undefined);
  });

  it("returns unauthorized when getAuthHeaders fails", async () => {
    service.authResult = err(ExceptionGraphQL.unauthorized());
    const result = await service.testQuery(
      dto("query Q { q }", undefined, {
        authenticated: true,
      }),
    );
    assertFailure(result);
    assert.equal(result.error.code, "GRAPHQL_UNAUTHORIZED");
  });

  it("merges custom headers", async () => {
    await service.testQuery(
      dto("query Q { q }", undefined, {
        headers: { "X-Custom": "value" },
      }),
    );
    assert.equal(mockCalls[0].headers["x-custom"], "value");
    assert.ok(
      mockCalls[0].headers["content-type"].includes("application/json"),
    );
  });
});

describe("ServiceGraphQL -- security", () => {
  let service: TestServiceGraphQL;

  beforeEach(() => {
    service = new TestServiceGraphQL();
    mockCalls = [];
    originalFetch = globalThis.fetch;
    globalThis.fetch = createMockFetch();
    setMockGraphQLResponse({ ok: true });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("rejects introspection query", async () => {
    const result = await service.testQuery(
      dto("{ __schema { types { name } } }"),
    );
    assertFailure(result);
    assert.equal(result.error.code, "GRAPHQL_UNSAFE_QUERY");
    assert.equal(mockCalls.length, 0);
  });

  it("rejects HTTP endpoint (non-secure) at TypeField level", () => {
    const result = FUrlOrigin.create("http://external-api.com/graphql");
    assert.ok(isFailure(result));
    assert.ok(result.error instanceof ExceptionValidation);
  });

  it("allows localhost HTTP for development", async () => {
    const devService = new (class extends TestServiceGraphQL {
      override readonly endpoint = FUrlOrigin.createOrThrow(
        "http://localhost:4000/graphql",
      );
    })();
    await devService.testQuery(dto("query Q { q }"));
    assert.equal(mockCalls.length, 1);
  });
});

describe("ServiceGraphQL -- timeout", () => {
  let service: TestServiceGraphQL;

  beforeEach(() => {
    service = new TestServiceGraphQL();
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("passes AbortController signal when timeout is set", async () => {
    let receivedSignal: AbortSignal | undefined;
    globalThis.fetch = (
      _input: string | URL | Request,
      init?: RequestInit,
    ): Promise<Response> => {
      receivedSignal = init?.signal ?? undefined;
      return Promise.resolve(
        new Response(JSON.stringify({ data: { ok: true } }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );
    };

    await service.testQuery(dto("query Q { q }", undefined, { timeout: 5000 }));
    assert.ok(receivedSignal instanceof AbortSignal);
  });

  it("does not pass signal when timeout is not set", async () => {
    let receivedSignal: AbortSignal | null | undefined = null;
    globalThis.fetch = (
      _input: string | URL | Request,
      init?: RequestInit,
    ): Promise<Response> => {
      receivedSignal = init?.signal;
      return Promise.resolve(
        new Response(JSON.stringify({ data: { ok: true } }), {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }),
      );
    };

    await service.testQuery(dto("query Q { q }"));
    assert.equal(receivedSignal, undefined);
  });
});
