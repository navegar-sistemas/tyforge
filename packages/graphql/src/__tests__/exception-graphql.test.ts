import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { ExceptionGraphQL } from "../exception-graphql";
import { Exceptions } from "tyforge/exceptions";
import { OHttpStatus } from "tyforge";

describe("ExceptionGraphQL -- factory methods", () => {
  it("queryFailed returns correct exception", () => {
    const errors = [{ message: "Field not found" }];
    const ex = ExceptionGraphQL.queryFailed("GetUsers", errors);
    assert.ok(ex instanceof ExceptionGraphQL);
    assert.ok(ex instanceof Exceptions);
    assert.equal(ex.code, "GRAPHQL_QUERY_FAILED");
    assert.equal(ex.status, OHttpStatus.BAD_GATEWAY);
    assert.equal(ex.typeInference, "ExceptionGraphQL");
    assert.equal(ex.graphqlErrors.length, 1);
    assert.equal(ex.operationName, "GetUsers");
  });

  it("mutationFailed returns correct exception", () => {
    const errors = [{ message: "Validation error" }];
    const ex = ExceptionGraphQL.mutationFailed("CreateUser", errors);
    assert.equal(ex.code, "GRAPHQL_MUTATION_FAILED");
    assert.equal(ex.status, OHttpStatus.BAD_GATEWAY);
    assert.equal(ex.operationName, "CreateUser");
  });

  it("networkError returns correct exception", () => {
    const ex = ExceptionGraphQL.networkError();
    assert.equal(ex.code, "GRAPHQL_NETWORK_ERROR");
    assert.equal(ex.status, OHttpStatus.BAD_GATEWAY);
  });

  it("unauthorized returns correct exception", () => {
    const ex = ExceptionGraphQL.unauthorized();
    assert.equal(ex.code, "GRAPHQL_UNAUTHORIZED");
    assert.equal(ex.status, OHttpStatus.UNAUTHORIZED);
  });

  it("timeout returns correct exception", () => {
    const ex = ExceptionGraphQL.timeout("SlowQuery");
    assert.equal(ex.code, "GRAPHQL_TIMEOUT");
    assert.equal(ex.status, OHttpStatus.GATEWAY_TIMEOUT);
    assert.equal(ex.operationName, "SlowQuery");
  });

  it("invalidResponse returns correct exception", () => {
    const ex = ExceptionGraphQL.invalidResponse("GetData");
    assert.equal(ex.code, "GRAPHQL_INVALID_RESPONSE");
    assert.equal(ex.status, OHttpStatus.BAD_GATEWAY);
    assert.equal(ex.operationName, "GetData");
  });

  it("unsafeQuery returns correct exception", () => {
    const ex = ExceptionGraphQL.unsafeQuery();
    assert.equal(ex.code, "GRAPHQL_UNSAFE_QUERY");
    assert.equal(ex.status, OHttpStatus.BAD_REQUEST);
  });
});

describe("ExceptionGraphQL -- retriable", () => {
  it("queryFailed is not retriable", () => {
    assert.equal(ExceptionGraphQL.queryFailed("Q", []).retriable, false);
  });

  it("mutationFailed is not retriable", () => {
    assert.equal(ExceptionGraphQL.mutationFailed("M", []).retriable, false);
  });

  it("networkError is retriable", () => {
    assert.equal(ExceptionGraphQL.networkError().retriable, true);
  });

  it("unauthorized is not retriable", () => {
    assert.equal(ExceptionGraphQL.unauthorized().retriable, false);
  });

  it("timeout is retriable", () => {
    assert.equal(ExceptionGraphQL.timeout("Q").retriable, true);
  });

  it("invalidResponse is not retriable", () => {
    assert.equal(ExceptionGraphQL.invalidResponse("Q").retriable, false);
  });

  it("unsafeQuery is not retriable", () => {
    assert.equal(ExceptionGraphQL.unsafeQuery().retriable, false);
  });
});

describe("ExceptionGraphQL -- serialization", () => {
  it("toJSON produces RFC 7807 compliant output", () => {
    const ex = ExceptionGraphQL.queryFailed("GetUsers", [{ message: "err" }]);
    const json = ex.toJSON();
    assert.equal(json.type, "graphql/query-failed");
    assert.equal(json.title, "GraphQL Query Failed");
    assert.equal(json.status, OHttpStatus.BAD_GATEWAY);
    assert.equal(json.code, "GRAPHQL_QUERY_FAILED");
    assert.equal(json.instance, "ServiceGraphQL");
  });

  it("graphqlErrors is non-enumerable (not in JSON.stringify)", () => {
    const ex = ExceptionGraphQL.queryFailed("Q", [{ message: "secret error" }]);
    const serialized = JSON.stringify(ex);
    assert.equal(serialized.includes("secret error"), false);
    assert.equal(serialized.includes("graphqlErrors"), false);
  });

  it("operationName is non-enumerable", () => {
    const ex = ExceptionGraphQL.queryFailed("MyOp", []);
    const descriptor = Object.getOwnPropertyDescriptor(ex, "operationName");
    assert.equal(descriptor?.enumerable, false);
  });

  it("graphqlErrors accessible programmatically", () => {
    const errors = [{ message: "Field not found", path: ["user", "name"] }];
    const ex = ExceptionGraphQL.queryFailed("GetUser", errors);
    assert.equal(ex.graphqlErrors.length, 1);
    assert.equal(ex.graphqlErrors[0].message, "Field not found");
    assert.deepEqual(ex.graphqlErrors[0].path, ["user", "name"]);
  });

  it("networkError cause is non-enumerable", () => {
    const cause = ExceptionGraphQL.timeout("Q");
    const ex = ExceptionGraphQL.networkError(cause);
    const serialized = JSON.stringify(ex);
    assert.equal(serialized.includes("GRAPHQL_TIMEOUT"), false);
    assert.equal(ex.cause, cause);
  });
});
