import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { FGraphQLDocument, FUrlOrigin } from "tyforge/type-fields";
import { isSuccess, isFailure } from "tyforge/result";
import { ServiceGraphQLSecurity } from "../service-graphql.security";

// -- isIntrospectionQuery --------------------------------------------

describe("ServiceGraphQLSecurity -- isIntrospectionQuery", () => {
  it("detects __schema introspection", () => {
    assert.equal(
      ServiceGraphQLSecurity.isIntrospectionQuery(
        FGraphQLDocument.createOrThrow("{ __schema { types { name } } }"),
      ),
      true,
    );
  });

  it("detects __type introspection", () => {
    assert.equal(
      ServiceGraphQLSecurity.isIntrospectionQuery(
        FGraphQLDocument.createOrThrow(
          '{ __type(name: "User") { fields { name } } }',
        ),
      ),
      true,
    );
  });

  it("detects introspection in larger query", () => {
    const query = FGraphQLDocument.createOrThrow(
      `query IntrospectionQuery { __schema { queryType { name } mutationType { name } } }`,
    );
    assert.equal(ServiceGraphQLSecurity.isIntrospectionQuery(query), true);
  });

  it("allows normal query without introspection", () => {
    assert.equal(
      ServiceGraphQLSecurity.isIntrospectionQuery(
        FGraphQLDocument.createOrThrow("query GetUsers { users { id name } }"),
      ),
      false,
    );
  });

  it("allows mutation without introspection", () => {
    assert.equal(
      ServiceGraphQLSecurity.isIntrospectionQuery(
        FGraphQLDocument.createOrThrow(
          "mutation CreateUser($input: UserInput!) { createUser(input: $input) { id } }",
        ),
      ),
      false,
    );
  });

  it("does not match partial words like schema_type", () => {
    assert.equal(
      ServiceGraphQLSecurity.isIntrospectionQuery(
        FGraphQLDocument.createOrThrow("query { schema_type { name } }"),
      ),
      false,
    );
  });
});

// -- sanitizeVariables -----------------------------------------------

describe("ServiceGraphQLSecurity -- sanitizeVariables", () => {
  it("passes clean variables unchanged", () => {
    const vars = { name: "Maria", age: 30 };
    const result = ServiceGraphQLSecurity.sanitizeVariables(vars);
    assert.ok(isSuccess(result));
    assert.deepEqual(result.value, { name: "Maria", age: 30 });
  });

  it("removes __proto__ key", () => {
    const vars = { __proto__: "polluted", name: "safe" };
    const result = ServiceGraphQLSecurity.sanitizeVariables(vars);
    assert.ok(isSuccess(result));
    assert.equal(Object.hasOwn(result.value, "__proto__"), false);
    assert.equal(result.value["name"], "safe");
  });

  it("removes constructor key", () => {
    const vars = { constructor: "polluted", name: "safe" };
    const result = ServiceGraphQLSecurity.sanitizeVariables(vars);
    assert.ok(isSuccess(result));
    assert.equal(Object.hasOwn(result.value, "constructor"), false);
    assert.equal(result.value["name"], "safe");
  });

  it("removes prototype key", () => {
    const vars = { prototype: "polluted", name: "safe" };
    const result = ServiceGraphQLSecurity.sanitizeVariables(vars);
    assert.ok(isSuccess(result));
    assert.equal(Object.hasOwn(result.value, "prototype"), false);
  });

  it("sanitizes nested objects recursively", () => {
    const vars = {
      input: {
        name: "Maria",
        __proto__: "polluted",
        address: {
          city: "SP",
          constructor: "polluted",
        },
      },
    };
    const result = ServiceGraphQLSecurity.sanitizeVariables(vars);
    assert.ok(isSuccess(result));
    const input = result.value["input"] as Record<string, unknown>;
    assert.equal(Object.hasOwn(input, "__proto__"), false);
    assert.equal(input["name"], "Maria");
    const address = input["address"] as Record<string, unknown>;
    assert.equal(Object.hasOwn(address, "constructor"), false);
    assert.equal(address["city"], "SP");
  });

  it("sanitizes objects inside arrays", () => {
    const vars = {
      items: [{ name: "safe", __proto__: "polluted" }, { name: "also safe" }],
    };
    const result = ServiceGraphQLSecurity.sanitizeVariables(vars);
    assert.ok(isSuccess(result));
    const items = result.value["items"] as Record<string, unknown>[];
    assert.equal(Object.hasOwn(items[0], "__proto__"), false);
    assert.equal(items[0]["name"], "safe");
    assert.equal(items[1]["name"], "also safe");
  });

  it("preserves primitive values in arrays", () => {
    const vars = { ids: [1, 2, 3], tags: ["a", "b"] };
    const result = ServiceGraphQLSecurity.sanitizeVariables(vars);
    assert.ok(isSuccess(result));
    assert.deepEqual(result.value["ids"], [1, 2, 3]);
    assert.deepEqual(result.value["tags"], ["a", "b"]);
  });

  it("handles empty object", () => {
    const result = ServiceGraphQLSecurity.sanitizeVariables({});
    assert.ok(isSuccess(result));
    assert.deepEqual(result.value, {});
  });

  it("returns error when nesting exceeds maximum depth", () => {
    let data: Record<string, unknown> = { value: "leaf" };
    for (let i = 0; i < 51; i++) {
      data = { nested: data };
    }
    const result = ServiceGraphQLSecurity.sanitizeVariables(data);
    assert.ok(isFailure(result));
    assert.equal(result.error.code, "GRAPHQL_INVALID_PARAMS");
  });
});

// -- FUrlOrigin validation (replaces isSecureEndpoint) ───────────

describe("FUrlOrigin — endpoint security validation", () => {
  it("accepts HTTPS endpoint", () => {
    assert.ok(isSuccess(FUrlOrigin.create("https://api.example.com/graphql")));
  });

  it("rejects HTTP endpoint", () => {
    assert.ok(isFailure(FUrlOrigin.create("http://api.example.com/graphql")));
  });

  it("accepts HTTP localhost (dev)", () => {
    assert.ok(isSuccess(FUrlOrigin.create("http://localhost:3000/graphql")));
  });

  it("accepts HTTP 127.0.0.1 (dev)", () => {
    assert.ok(isSuccess(FUrlOrigin.create("http://127.0.0.1:4000/graphql")));
  });

  it("rejects non-URL string", () => {
    assert.ok(isFailure(FUrlOrigin.create("not-a-url")));
  });
});
