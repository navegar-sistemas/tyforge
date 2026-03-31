import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { ToolObjectTransform } from "@tyforge/tools/object-transform.tool";

// ── Deep mock for comprehensive tests ───────────────────────────

const DEEP_MOCK = {
  app: {
    name: "tyforge",
    version: "1.0.0",
    debug: false,
    port: 3000,
    tags: ["api", "ddd"],
    features: [
      { name: "schema", enabled: true },
      { name: "lint", enabled: false },
    ],
  },
  database: {
    primary: {
      host: "localhost",
      port: 5432,
      ssl: true,
      credentials: {
        user: "admin",
        password: null,
        roles: ["read", "write"],
        options: {
          timeout: 30000,
          retries: 3,
          hooks: [
            { event: "connect", handler: "onConnect" },
            { event: "error", handler: "onError" },
          ],
          pool: {
            min: 2,
            max: 10,
            idle: {
              timeout: 10000,
              check: {
                interval: 5000,
                enabled: true,
                strategy: {
                  type: "exponential",
                  factor: 2,
                  metadata: { createdBy: "system", tags: [1, 2, 3] },
                  limits: {
                    floor: 1000,
                    ceiling: 60000,
                    jitter: {
                      enabled: true,
                      range: [100, 500],
                      distributions: [
                        { type: "uniform", weight: 0.7 },
                        { type: "gaussian", weight: 0.3 },
                      ],
                      seed: {
                        algorithm: "random",
                        entropy: 256,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    replicas: [
      {
        host: "replica-1",
        port: 5433,
        readonly: true,
        zones: ["us-east", "us-west"],
      },
      { host: "replica-2", port: 5434, readonly: true, zones: ["eu-central"] },
    ],
  },
  schema: {
    validate: {
      create: "full",
      assign: "type",
    },
  },
  cache: {
    enabled: true,
    ttl: 300,
    driver: "redis",
    connection: {
      host: "127.0.0.1",
      port: 6379,
      db: 0,
      sentinel: {
        nodes: [
          { host: "sentinel-1", port: 26379 },
          { host: "sentinel-2", port: 26380 },
        ],
        name: "mymaster",
      },
    },
  },
  logging: {
    level: "info",
    targets: ["stdout", "file"],
    formatters: [
      { type: "json", pretty: false },
      {
        type: "text",
        template: "[{level}] {msg}",
        colors: { error: "red", warn: "yellow" },
      },
    ],
    file: {
      path: "/var/log/app.log",
      rotation: {
        enabled: true,
        maxSize: "10mb",
        maxFiles: 5,
      },
    },
  },
  pipelines: [
    {
      name: "ingest",
      steps: [
        { action: "parse", config: { format: "json", strict: true } },
        {
          action: "validate",
          config: { schema: "v2", rules: ["no-null", "no-empty"] },
        },
        {
          action: "transform",
          config: { mapping: { input: "raw", output: "processed" } },
        },
      ],
    },
  ],
};

// ── flatten ──────────────────────────────────────────────────────

describe("ToolObjectTransform.flatten", () => {
  it("1 — simple object (1 level)", () => {
    const input = { name: "test", age: 30 };
    const flat = ToolObjectTransform.flatten(input);

    assert.strictEqual(flat.size, 2);
    assert.strictEqual(flat.get("name"), "test");
    assert.strictEqual(flat.get("age"), 30);
  });

  it("2 — nested object (3 levels)", () => {
    const input = { a: { b: { c: "value" } } };
    const flat = ToolObjectTransform.flatten(input);

    assert.strictEqual(flat.size, 1);
    assert.strictEqual(flat.get("a.b.c"), "value");
  });

  it("3 — DEEP_MOCK complete: exact leaf count and sample values", () => {
    const flat = ToolObjectTransform.flatten(DEEP_MOCK);

    // Exact leaf count
    assert.strictEqual(flat.size, 50);

    // Primitive values at various depths
    assert.strictEqual(flat.get("app.name"), "tyforge");
    assert.strictEqual(flat.get("app.debug"), false);
    assert.strictEqual(flat.get("app.port"), 3000);
    assert.strictEqual(flat.get("database.primary.host"), "localhost");
    assert.strictEqual(flat.get("database.primary.port"), 5432);
    assert.strictEqual(flat.get("cache.driver"), "redis");
    assert.strictEqual(flat.get("logging.level"), "info");
    assert.strictEqual(flat.get("schema.validate.create"), "full");

    // null value
    assert.strictEqual(flat.get("database.primary.credentials.password"), null);

    // Arrays of primitives remain as arrays
    assert.deepStrictEqual(flat.get("app.tags"), ["api", "ddd"]);
    assert.deepStrictEqual(flat.get("database.primary.credentials.roles"), [
      "read",
      "write",
    ]);
    assert.deepStrictEqual(flat.get("logging.targets"), ["stdout", "file"]);

    // Arrays of objects remain as arrays (not expanded)
    assert.ok(Array.isArray(flat.get("app.features")));
    assert.ok(Array.isArray(flat.get("database.replicas")));
    assert.ok(Array.isArray(flat.get("pipelines")));
  });

  it("4 — mixed primitives and nested objects", () => {
    const input = {
      name: "x",
      address: { city: "SP", geo: { lat: -23, lng: -46 } },
    };
    const flat = ToolObjectTransform.flatten(input);

    assert.strictEqual(flat.size, 4);
    assert.strictEqual(flat.get("name"), "x");
    assert.strictEqual(flat.get("address.city"), "SP");
    assert.strictEqual(flat.get("address.geo.lat"), -23);
    assert.strictEqual(flat.get("address.geo.lng"), -46);
  });

  it("5 — empty object returns empty Map (size 0)", () => {
    const flat = ToolObjectTransform.flatten({});

    assert.strictEqual(flat.size, 0);
    assert.ok(flat instanceof Map);
  });

  it("6 — types preserved: null, boolean, number, string", () => {
    const input = { a: null, b: true, c: 42, d: "str" };
    const flat = ToolObjectTransform.flatten(input);

    assert.strictEqual(flat.get("a"), null);
    assert.strictEqual(flat.get("b"), true);
    assert.strictEqual(flat.get("c"), 42);
    assert.strictEqual(flat.get("d"), "str");

    // Verify exact types (not coerced)
    assert.strictEqual(typeof flat.get("b"), "boolean");
    assert.strictEqual(typeof flat.get("c"), "number");
    assert.strictEqual(typeof flat.get("d"), "string");
  });

  it("13 — arrays of objects treated as leaf values (not expanded)", () => {
    const flat = ToolObjectTransform.flatten(DEEP_MOCK);

    // All array values must remain intact as arrays
    const arrayKeys = [
      "app.features",
      "database.primary.credentials.options.hooks",
      "database.primary.credentials.options.pool.idle.check.strategy.limits.jitter.distributions",
      "database.replicas",
      "cache.connection.sentinel.nodes",
      "logging.formatters",
      "pipelines",
    ];

    for (const key of arrayKeys) {
      const val = flat.get(key);
      assert.ok(
        Array.isArray(val),
        `Expected "${key}" to be an array, got ${typeof val}`,
      );
    }

    // Verify no key starts with these array paths + "."
    // (arrays are not expanded)
    for (const key of arrayKeys) {
      for (const flatKey of flat.keys()) {
        assert.ok(
          !flatKey.startsWith(key + "."),
          `Key "${flatKey}" should not exist because "${key}" is an array leaf`,
        );
      }
    }
  });

  it("14 — deepest key resolves correctly", () => {
    const flat = ToolObjectTransform.flatten(DEEP_MOCK);

    assert.strictEqual(
      flat.get(
        "database.primary.credentials.options.pool.idle.check.strategy.limits.jitter.seed.entropy",
      ),
      256,
    );
    assert.strictEqual(
      flat.get(
        "database.primary.credentials.options.pool.idle.check.strategy.limits.jitter.seed.algorithm",
      ),
      "random",
    );
  });
});

// ── unflatten ────────────────────────────────────────────────────

describe("ToolObjectTransform.unflatten", () => {
  it("7 — simple object from flat Map", () => {
    const flat = new Map<string, unknown>([["name", "test"]]);
    const result = ToolObjectTransform.unflatten(flat);

    assert.deepStrictEqual(result, { name: "test" });
  });

  it("8 — nested (3 levels) from dotted key", () => {
    const flat = new Map<string, unknown>([["a.b.c", "value"]]);
    const result = ToolObjectTransform.unflatten(flat);

    assert.deepStrictEqual(result, { a: { b: { c: "value" } } });
  });

  it("9 — multiple keys at same level", () => {
    const flat = new Map<string, unknown>([
      ["a.b", 1],
      ["a.c", 2],
    ]);
    const result = ToolObjectTransform.unflatten(flat);

    assert.deepStrictEqual(result, { a: { b: 1, c: 2 } });
  });
});

// ── round-trip ───────────────────────────────────────────────────

describe("ToolObjectTransform round-trip", () => {
  it("10 — unflatten(flatten(DEEP_MOCK)) equals DEEP_MOCK", () => {
    const flat = ToolObjectTransform.flatten(DEEP_MOCK);
    const restored = ToolObjectTransform.unflatten(flat);

    assert.deepStrictEqual(restored, DEEP_MOCK);
  });

  it("11 — flatten(unflatten(flat)) has same entries as original flat", () => {
    const originalFlat = ToolObjectTransform.flatten(DEEP_MOCK);
    const restored = ToolObjectTransform.unflatten(originalFlat);
    const reFlattened = ToolObjectTransform.flatten(restored);

    assert.strictEqual(reFlattened.size, originalFlat.size);
    for (const [key, value] of originalFlat) {
      assert.ok(reFlattened.has(key), `Missing key after re-flatten: "${key}"`);
      assert.deepStrictEqual(
        reFlattened.get(key),
        value,
        `Value mismatch for key: "${key}"`,
      );
    }
  });

  it("12 — round-trip with mixed types object", () => {
    const mixed = {
      str: "hello",
      num: 99,
      bool: false,
      nil: null,
      arr: [1, 2, 3],
      nested: {
        deep: {
          value: "found",
          list: ["a", "b"],
        },
        flag: true,
      },
    };

    const flat = ToolObjectTransform.flatten(mixed);
    const restored = ToolObjectTransform.unflatten(flat);

    assert.deepStrictEqual(restored, mixed);
  });

  it("15 — arrays of objects with nested objects preserved", () => {
    const flat = ToolObjectTransform.flatten(DEEP_MOCK);
    const restored = ToolObjectTransform.unflatten(flat);

    // formatters[1].colors preserved with nested object
    const formatters = (restored as typeof DEEP_MOCK).logging.formatters;
    assert.deepStrictEqual(formatters[1].colors, {
      error: "red",
      warn: "yellow",
    });

    // pipelines[0].steps[2].config.mapping preserved
    const pipelines = (restored as typeof DEEP_MOCK).pipelines;
    assert.deepStrictEqual(pipelines[0].steps[2].config.mapping, {
      input: "raw",
      output: "processed",
    });
  });
});

// ── security ────────────────────────────────────────────────────

describe("ToolObjectTransform security", () => {
  it("unflatten skips __proto__ keys", () => {
    const flat = new Map<string, unknown>([
      ["__proto__.polluted", "yes"],
      ["name", "safe"],
    ]);
    const result = ToolObjectTransform.unflatten(flat);
    assert.equal(result["name"], "safe");
    assert.equal("polluted" in Object.prototype, false);
    assert.equal(
      Object.prototype.hasOwnProperty.call(result, "__proto__"),
      false,
    );
  });

  it("unflatten skips constructor keys", () => {
    const flat = new Map<string, unknown>([
      ["constructor.prototype.polluted", "yes"],
      ["name", "safe"],
    ]);
    const result = ToolObjectTransform.unflatten(flat);
    assert.equal(result["name"], "safe");
    assert.equal(
      Object.prototype.hasOwnProperty.call(result, "constructor"),
      false,
    );
  });

  it("unflatten skips prototype keys", () => {
    const flat = new Map<string, unknown>([
      ["a.prototype.b", "yes"],
      ["name", "safe"],
    ]);
    const result = ToolObjectTransform.unflatten(flat);
    assert.equal(result["name"], "safe");
    assert.equal(result["a"], undefined);
  });
});
