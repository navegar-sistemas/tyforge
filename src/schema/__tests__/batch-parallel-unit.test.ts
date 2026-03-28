import { describe, it, before } from "node:test";
import { strict as assert } from "node:assert";
import { createParallelProcessor } from "@tyforge/schema/batch-parallel";
import { SchemaBuilder } from "@tyforge/schema/schema-build";
import { FString } from "@tyforge/type-fields/string.format_vo";
import { FEmail } from "@tyforge/type-fields/email.format_vo";
import { FInt } from "@tyforge/type-fields/int.format_vo";
import { FBoolean } from "@tyforge/type-fields/boolean.format_vo";
import type { ISchema, IParallelProcessor, TAssignFn } from "@tyforge/schema/schema-types";

// ── Schemas ─────────────────────────────────────────────────────

const simpleSchema = {
  name: { type: FString },
  email: { type: FEmail },
  age: { type: FInt },
} satisfies ISchema;

const nestedSchema = {
  title: { type: FString },
  active: { type: FBoolean },
  address: {
    street: { type: FString },
    city: { type: FString },
  },
} satisfies ISchema;

const validator = SchemaBuilder.compile(simpleSchema);

// Resolves both sync and async batchCreate results uniformly.
// batchCreate returns sync without concurrency, async with concurrency > 1.
async function resolveBatch<T>(result: T | Promise<T>): Promise<T> {
  return result;
}

// ── Factories ───────────────────────────────────────────────────

function makeValid(i: number) {
  return { name: `User${i}`, email: `user${i}@test.com`, age: 20 + (i % 50) };
}

function makeInvalid(i: number) {
  return { name: "", email: `user${i}@test.com`, age: 20 };
}

function makeMixed(length: number, invalidEvery: number) {
  return Array.from({ length }, (_, i) => i % invalidEvery === 0 ? makeInvalid(i) : makeValid(i));
}

// ── createParallelProcessor ─────────────────────────────────────

describe("createParallelProcessor", () => {
  it("returns a valid processor in Node.js", () => {
    const processor = createParallelProcessor();
    assert.notEqual(processor, null);
  });

  it("processor has process method", () => {
    const processor = createParallelProcessor();
    assert.ok(processor);
    assert.equal(typeof processor.process, "function");
  });
});

// ── batchCreate — sequential (public API) ───────────────────────

describe("batchCreate — sequential", () => {
  it("validates all valid items", async () => {
    const items = Array.from({ length: 100 }, (_, i) => makeValid(i));
    const result = await resolveBatch(validator.batchCreate(items));
    assert.equal(result.ok.length, 100);
    assert.equal(result.errors.length, 0);
  });

  it("collects errors with correct indices", async () => {
    const items = [makeValid(0), makeInvalid(1), makeValid(2), makeInvalid(3), makeValid(4)];
    const result = await resolveBatch(validator.batchCreate(items));
    assert.equal(result.ok.length, 3);
    assert.equal(result.errors.length, 2);
    assert.equal(result.errors[0].index, 1);
    assert.equal(result.errors[1].index, 3);
  });

  it("handles empty array", async () => {
    const result = await resolveBatch(validator.batchCreate([]));
    assert.equal(result.ok.length, 0);
    assert.equal(result.errors.length, 0);
  });

  it("handles single item", async () => {
    const result = await resolveBatch(validator.batchCreate([makeValid(0)]));
    assert.equal(result.ok.length, 1);
    assert.equal(result.errors.length, 0);
  });
});

// ── batchCreate — parallel (public API) ─────────────────────────

describe("batchCreate — parallel", () => {
  it("validates items with concurrency 2", async () => {
    const items = Array.from({ length: 20 }, (_, i) => makeValid(i));
    const result = await resolveBatch(validator.batchCreate(items, { concurrency: 2, chunkSize: 10 }));
    assert.equal(result.ok.length, 20);
    assert.equal(result.errors.length, 0);
  });

  it("collects errors across workers", async () => {
    const items = makeMixed(20, 3);
    const result = await resolveBatch(validator.batchCreate(items, { concurrency: 2, chunkSize: 10 }));
    const invalidCount = items.filter((_, i) => i % 3 === 0).length;
    assert.equal(result.ok.length, items.length - invalidCount);
    assert.equal(result.errors.length, invalidCount);
  });

  it("matches sequential results for same data", async () => {
    const items = makeMixed(50, 5);
    const sequential = await resolveBatch(validator.batchCreate(items));
    const parallel = await resolveBatch(validator.batchCreate(items, { concurrency: 2, chunkSize: 25 }));
    assert.equal(parallel.ok.length, sequential.ok.length);
    assert.equal(parallel.errors.length, sequential.errors.length);
  });

  it("falls back to sequential when concurrency is 1", async () => {
    const items = Array.from({ length: 10 }, (_, i) => makeValid(i));
    const result = await resolveBatch(validator.batchCreate(items, { concurrency: 1 }));
    assert.equal(result.ok.length, 10);
    assert.equal(result.errors.length, 0);
  });
});

// ── ParallelBatchProcessor (direct) ─────────────────────────────

describe("ParallelBatchProcessor", () => {
  let processor: IParallelProcessor;
  const assignSimple: TAssignFn<typeof simpleSchema> = (data) => validator.assign<unknown>(data);
  const nestedValidator = SchemaBuilder.compile(nestedSchema);
  const assignNested: TAssignFn<typeof nestedSchema> = (data) => nestedValidator.assign<unknown>(data);

  before(() => {
    const created = createParallelProcessor();
    assert.ok(created, "ParallelBatchProcessor not available in this environment");
    processor = created;
  });

  describe("valid data", () => {
    it("processes batch with concurrency 2", async () => {
      const items = Array.from({ length: 10 }, (_, i) => makeValid(i));
      const result = await processor.process(simpleSchema, items, { concurrency: 2, chunkSize: 5 }, assignSimple);
      assert.equal(result.ok.length, 10);
      assert.equal(result.errors.length, 0);
    });

    it("processes single item", async () => {
      const result = await processor.process(simpleSchema, [makeValid(0)], { concurrency: 2, chunkSize: 10 }, assignSimple);
      assert.equal(result.ok.length, 1);
      assert.equal(result.errors.length, 0);
    });

    it("processes empty array", async () => {
      const result = await processor.process(simpleSchema, [], { concurrency: 2, chunkSize: 10 }, assignSimple);
      assert.equal(result.ok.length, 0);
      assert.equal(result.errors.length, 0);
    });

    it("preserves field values after reconstruction", async () => {
      const items = [{ name: "Alice", email: "alice@test.com", age: 30 }];
      const result = await processor.process(simpleSchema, items, { concurrency: 2, chunkSize: 10 }, assignSimple);
      assert.equal(result.ok.length, 1);
      assert.equal(result.ok[0].name.getValue(), "Alice");
      assert.equal(result.ok[0].email.getValue(), "alice@test.com");
      assert.equal(result.ok[0].age.getValue(), 30);
    });
  });

  describe("invalid data", () => {
    it("collects errors", async () => {
      const items = [makeValid(0), makeInvalid(1), makeValid(2)];
      const result = await processor.process(simpleSchema, items, { concurrency: 2, chunkSize: 2 }, assignSimple);
      assert.equal(result.ok.length, 2);
      assert.equal(result.errors.length, 1);
    });

    it("reports correct indices", async () => {
      const items = [makeInvalid(0), makeValid(1), makeInvalid(2), makeValid(3), makeInvalid(4)];
      const result = await processor.process(simpleSchema, items, { concurrency: 2, chunkSize: 3 }, assignSimple);
      assert.equal(result.ok.length, 2);
      assert.equal(result.errors.length, 3);
      assert.deepEqual(result.errors.map(e => e.index), [0, 2, 4]);
    });

    it("handles all-invalid batch", async () => {
      const items = Array.from({ length: 6 }, (_, i) => makeInvalid(i));
      const result = await processor.process(simpleSchema, items, { concurrency: 2, chunkSize: 3 }, assignSimple);
      assert.equal(result.ok.length, 0);
      assert.equal(result.errors.length, 6);
    });
  });

  describe("result ordering", () => {
    it("successes sorted by original index", async () => {
      const items = Array.from({ length: 20 }, (_, i) => makeValid(i));
      const result = await processor.process(simpleSchema, items, { concurrency: 4, chunkSize: 5 }, assignSimple);
      assert.equal(result.ok.length, 20);
      for (let i = 0; i < result.ok.length; i++) {
        assert.equal(result.ok[i].name.getValue(), `User${i}`);
      }
    });

    it("errors sorted by original index", async () => {
      const items = makeMixed(20, 2);
      const result = await processor.process(simpleSchema, items, { concurrency: 4, chunkSize: 5 }, assignSimple);
      for (let i = 1; i < result.errors.length; i++) {
        assert.ok(result.errors[i].index > result.errors[i - 1].index);
      }
    });
  });

  describe("chunk sizes", () => {
    it("chunkSize 1 — one item per worker", async () => {
      const items = Array.from({ length: 5 }, (_, i) => makeValid(i));
      const result = await processor.process(simpleSchema, items, { concurrency: 2, chunkSize: 1 }, assignSimple);
      assert.equal(result.ok.length, 5);
      assert.equal(result.errors.length, 0);
    });

    it("chunkSize larger than items — single chunk", async () => {
      const items = Array.from({ length: 5 }, (_, i) => makeValid(i));
      const result = await processor.process(simpleSchema, items, { concurrency: 2, chunkSize: 100 }, assignSimple);
      assert.equal(result.ok.length, 5);
      assert.equal(result.errors.length, 0);
    });
  });

  describe("nested schema", () => {
    it("validates nested objects across workers", async () => {
      const items = [
        { title: "Item1", active: true, address: { street: "Rua A", city: "SP" } },
        { title: "Item2", active: false, address: { street: "Rua B", city: "RJ" } },
      ];
      const result = await processor.process(nestedSchema, items, { concurrency: 2, chunkSize: 1 }, assignNested);
      assert.equal(result.ok.length, 2);
      assert.equal(result.errors.length, 0);
      assert.equal(result.ok[0].title.getValue(), "Item1");
      assert.equal(result.ok[0].address.street.getValue(), "Rua A");
    });

    it("reports errors in nested fields", async () => {
      const items = [{ title: "Item1", active: true, address: { street: "", city: "SP" } }];
      const result = await processor.process(nestedSchema, items, { concurrency: 2, chunkSize: 10 }, assignNested);
      assert.equal(result.ok.length, 0);
      assert.equal(result.errors.length, 1);
    });
  });
});
