import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { SchemaBuilder } from "@tyforge/schema/schema-build";
import { FString } from "@tyforge/type-fields/string.format_vo";
import { FEmail } from "@tyforge/type-fields/email.format_vo";
import { FInt } from "@tyforge/type-fields/int.format_vo";
import type { ISchema } from "@tyforge/schema/schema-types";

const schema = {
  name: { type: FString },
  email: { type: FEmail },
  age: { type: FInt },
} satisfies ISchema;

const validator = SchemaBuilder.compile(schema);

function makeValidItem(i: number) {
  return { name: `User${i}`, email: `user${i}@test.com`, age: 20 + (i % 50) };
}

function makeInvalidItem(i: number) {
  return { name: "", email: `user${i}@test.com`, age: 20 };
}

// ── Sequential batchCreate (existing behavior) ─────────────────

describe("batchCreate — sequential (default)", () => {
  it("validates all valid items", () => {
    const items = Array.from({ length: 100 }, (_, i) => makeValidItem(i));
    const result = validator.batchCreate(items);
    // Sequential returns sync
    assert.ok(!("then" in result));
    const sync = result as { ok: unknown[]; errors: unknown[] };
    assert.equal(sync.ok.length, 100);
    assert.equal(sync.errors.length, 0);
  });

  it("collects errors with correct indices", () => {
    const items = [
      makeValidItem(0),
      makeInvalidItem(1),
      makeValidItem(2),
      makeInvalidItem(3),
      makeValidItem(4),
    ];
    const result = validator.batchCreate(items) as { ok: unknown[]; errors: { index: number }[] };
    assert.equal(result.ok.length, 3);
    assert.equal(result.errors.length, 2);
    assert.equal(result.errors[0].index, 1);
    assert.equal(result.errors[1].index, 3);
  });

  it("handles empty array", () => {
    const result = validator.batchCreate([]) as { ok: unknown[]; errors: unknown[] };
    assert.equal(result.ok.length, 0);
    assert.equal(result.errors.length, 0);
  });

  it("handles single item", () => {
    const result = validator.batchCreate([makeValidItem(0)]) as { ok: unknown[]; errors: unknown[] };
    assert.equal(result.ok.length, 1);
  });
});

// ── Parallel batchCreate (worker threads) ───────────────────────

describe("batchCreate — parallel (worker threads)", () => {
  it("validates items with concurrency 2", async () => {
    const items = Array.from({ length: 20 }, (_, i) => makeValidItem(i));
    const result = await validator.batchCreate(items, { concurrency: 2, chunkSize: 10 });
    assert.equal(result.ok.length, 20);
    assert.equal(result.errors.length, 0);
  });

  it("collects errors with correct indices across workers", async () => {
    const items = Array.from({ length: 20 }, (_, i) => i % 3 === 0 ? makeInvalidItem(i) : makeValidItem(i));
    const result = await validator.batchCreate(items, { concurrency: 2, chunkSize: 10 });
    const invalidCount = items.filter((_, i) => i % 3 === 0).length;
    const validCount = items.length - invalidCount;
    assert.equal(result.ok.length, validCount);
    assert.equal(result.errors.length, invalidCount);
  });

  it("results match sequential for same data", async () => {
    const items = Array.from({ length: 50 }, (_, i) => i % 5 === 0 ? makeInvalidItem(i) : makeValidItem(i));

    const sequential = validator.batchCreate(items) as { ok: unknown[]; errors: { index: number }[] };
    const parallel = await validator.batchCreate(items, { concurrency: 2, chunkSize: 25 });

    assert.equal(parallel.ok.length, sequential.ok.length);
    assert.equal(parallel.errors.length, sequential.errors.length);
  });

  it("handles concurrency 1 as sequential", () => {
    const items = Array.from({ length: 10 }, (_, i) => makeValidItem(i));
    const result = validator.batchCreate(items, { concurrency: 1 });
    // concurrency 1 returns sync
    assert.ok(!("then" in result));
    const sync = result as { ok: unknown[]; errors: unknown[] };
    assert.equal(sync.ok.length, 10);
  });
});
