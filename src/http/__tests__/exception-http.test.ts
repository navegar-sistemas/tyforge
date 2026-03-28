import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { ExceptionHttp } from "@tyforge/http/exception-http";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { OHttpStatus } from "@tyforge/constants/http-status.constants";

describe("ExceptionHttp — factory methods", () => {
  it("unsafeEndpoint returns correct exception", () => {
    const ex = ExceptionHttp.unsafeEndpoint();
    assert.ok(ex instanceof ExceptionHttp);
    assert.ok(ex instanceof Exceptions);
    assert.equal(ex.code, "UNSAFE_ENDPOINT");
    assert.equal(ex.status, OHttpStatus.BAD_REQUEST);
    assert.equal(ex.typeInference, "ExceptionHttp");
  });

  it("failedUrlConstruction returns correct exception", () => {
    const ex = ExceptionHttp.failedUrlConstruction();
    assert.ok(ex instanceof ExceptionHttp);
    assert.equal(ex.code, "FAILED_URL_CONSTRUCTION");
    assert.equal(ex.status, OHttpStatus.BAD_REQUEST);
  });

  it("failedSerialization returns correct exception", () => {
    const ex = ExceptionHttp.failedSerialization();
    assert.ok(ex instanceof ExceptionHttp);
    assert.equal(ex.code, "FAILED_SERIALIZATION");
    assert.equal(ex.status, OHttpStatus.BAD_REQUEST);
  });

  it("externalApiFailed without error details", () => {
    const ex = ExceptionHttp.externalApiFailed();
    assert.ok(ex instanceof ExceptionHttp);
    assert.equal(ex.code, "EXTERNAL_API_FAILED");
    assert.equal(ex.status, OHttpStatus.BAD_GATEWAY);
    assert.equal(ex.detail, "External API request failed.");
    assert.equal(ex.externalError, undefined);
  });

  it("externalApiFailed with error details", () => {
    const ex = ExceptionHttp.externalApiFailed({ status: 422, data: { message: "Invalid" } });
    assert.ok(ex instanceof ExceptionHttp);
    assert.equal(ex.code, "EXTERNAL_API_FAILED");
    assert.equal(ex.status, OHttpStatus.BAD_GATEWAY);
    assert.equal(ex.detail, "External API returned status 422.");
    assert.deepEqual(ex.externalError, { status: 422, data: { message: "Invalid" } });
  });

  it("authFailed returns correct exception", () => {
    const ex = ExceptionHttp.authFailed();
    assert.ok(ex instanceof ExceptionHttp);
    assert.equal(ex.code, "AUTH_FAILED");
    assert.equal(ex.status, OHttpStatus.UNAUTHORIZED);
  });

  it("timeout returns correct exception", () => {
    const ex = ExceptionHttp.timeout();
    assert.ok(ex instanceof ExceptionHttp);
    assert.equal(ex.code, "REQUEST_TIMEOUT");
    assert.equal(ex.status, OHttpStatus.GATEWAY_TIMEOUT);
  });
});

describe("ExceptionHttp — retriable", () => {
  it("unsafeEndpoint is not retriable", () => {
    assert.equal(ExceptionHttp.unsafeEndpoint().retriable, false);
  });

  it("failedUrlConstruction is not retriable", () => {
    assert.equal(ExceptionHttp.failedUrlConstruction().retriable, false);
  });

  it("failedSerialization is not retriable", () => {
    assert.equal(ExceptionHttp.failedSerialization().retriable, false);
  });

  it("externalApiFailed is retriable", () => {
    assert.equal(ExceptionHttp.externalApiFailed().retriable, true);
  });

  it("authFailed is not retriable", () => {
    assert.equal(ExceptionHttp.authFailed().retriable, false);
  });

  it("timeout is retriable", () => {
    assert.equal(ExceptionHttp.timeout().retriable, true);
  });
});

describe("ExceptionHttp — serialization", () => {
  it("toJSON produces RFC 7807 compliant output", () => {
    const ex = ExceptionHttp.externalApiFailed({ status: 500, data: "error" });
    const json = ex.toJSON();
    assert.equal(json.type, "http/external-api-failed");
    assert.equal(json.title, "External API Failed");
    assert.equal(json.status, OHttpStatus.BAD_GATEWAY);
    assert.equal(json.code, "EXTERNAL_API_FAILED");
    assert.equal(json.instance, "ServiceHttp");
    assert.equal(typeof json.detail, "string");
  });

  it("toJSON does not leak externalError", () => {
    const ex = ExceptionHttp.externalApiFailed({ status: 500, data: { secret: "token123" } });
    const json = ex.toJSON();
    assert.equal(json["externalError"], undefined);
  });

  it("externalError is non-enumerable (not in JSON.stringify)", () => {
    const ex = ExceptionHttp.externalApiFailed({ status: 500, data: { secret: "token123" } });
    const serialized = JSON.stringify(ex);
    assert.equal(serialized.includes("token123"), false);
    assert.equal(serialized.includes("externalError"), false);
  });

  it("externalError is accessible programmatically", () => {
    const ex = ExceptionHttp.externalApiFailed({ status: 500, data: { error: "details" } });
    assert.equal(ex.externalError?.status, 500);
    assert.deepEqual(ex.externalError?.data, { error: "details" });
  });

  it("externalApiFailed with status only (no data)", () => {
    const ex = ExceptionHttp.externalApiFailed({ status: 503 });
    assert.equal(ex.detail, "External API returned status 503.");
    assert.equal(ex.externalError?.status, 503);
    assert.equal(ex.externalError?.data, undefined);
  });
});
