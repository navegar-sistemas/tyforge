import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { SchemaBuilder } from "@tyforge/schema/schema-build";
import { isSuccess, isFailure, ok, Result } from "@tyforge/result/result";
import { FString } from "@tyforge/type-fields/string.format_vo";
import { FEmail } from "@tyforge/type-fields/email.format_vo";
import { FInt } from "@tyforge/type-fields/int.format_vo";
import { FBoolean } from "@tyforge/type-fields/boolean.format_vo";
import { FId } from "@tyforge/type-fields/id.format_vo";
import { Aggregate } from "@tyforge/domain-models/agreggate.base";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { InferProps, InferJson, Schema } from "@tyforge/schema/schema-types";
import { TClassInfo } from "@tyforge/domain-models/class.base";
import { assertType } from "@tyforge/common/assert-type";

// ── Helpers ─────────────────────────────────────────────────────

function assertSuccess<T, E>(result: Result<T, E>): asserts result is { success: true; value: T } {
  if (!isSuccess(result)) {
    assert.fail(`Expected success but got failure: ${JSON.stringify(result.error)}`);
  }
}

function assertFailure<T, E>(result: Result<T, E>): asserts result is { success: false; error: E } {
  if (!isFailure(result)) {
    assert.fail("Expected failure but got success");
  }
}

function createWithUntypedData<T extends Schema>(schema: T, data: unknown): Result<Record<string, unknown>, Exceptions> {
  const validator = SchemaBuilder.compile(schema);
  assertType<Parameters<typeof validator.create>[0]>(data);
  const result = validator.create(data);
  assertType<Result<Record<string, unknown>, Exceptions>>(result);
  return result;
}

// ── Schema: 15+ níveis de aninhamento ───────────────────────────
//
// Order (Aggregate)
// ├── id: FId
// ├── customer
// │   ├── name, email, age, active
// │   └── addresses[] → street, city, location → lat, lng, metadata
// │       → source, accuracy, tags[], history[] → timestamp, value
// │         → details → reason, codes[], audit → by, level, flags[]
// │           → nested → deep1 → deep2 → deep3 → deep4 → deep5
// │             → value, items[]
// ├── items[] → productId, name, quantity, tags[]
// │   └── variants[] → sku, price, attributes → color, sizes[]
// └── payment → method, amount, installments[] → number, value

const orderSchema = {
  id: { type: FId, required: false },
  customer: {
    name: { type: FString },
    email: { type: FEmail },
    age: { type: FInt },
    active: { type: FBoolean },
    addresses: { type: {
      street: { type: FString },
      city: { type: FString },
      location: {
        lat: { type: FInt },
        lng: { type: FInt },
        metadata: {
          source: { type: FString },
          accuracy: { type: FInt },
          tags: { type: FString, isArray: true },
          history: { type: {
            timestamp: { type: FString },
            value: { type: FInt },
            details: {
              reason: { type: FString },
              codes: { type: FInt, isArray: true },
              audit: {
                by: { type: FString },
                level: { type: FInt },
                flags: { type: FString, isArray: true },
                nested: {
                  deep1: {
                    deep2: {
                      deep3: {
                        deep4: {
                          deep5: {
                            value: { type: FString },
                            items: { type: FString, isArray: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          }, isArray: true },
        },
      },
    }, isArray: true },
  },
  items: { type: {
    productId: { type: FId },
    name: { type: FString },
    quantity: { type: FInt },
    tags: { type: FString, isArray: true },
    variants: { type: {
      sku: { type: FString },
      price: { type: FInt },
      attributes: {
        color: { type: FString },
        sizes: { type: FString, isArray: true },
      },
    }, isArray: true },
  }, isArray: true },
  payment: {
    method: { type: FString },
    amount: { type: FInt },
    installments: { type: {
      number: { type: FInt },
      value: { type: FInt },
    }, isArray: true },
  },
} satisfies Schema;

const validUUID1 = "019d0863-5d45-7246-b6d0-de5098bfd12e";
const validUUID2 = "019d0863-5d45-7246-b6d0-de5098bfd13f";

// ── Dados válidos completos ─────────────────────────────────────

function makeValidOrderData() {
  return {
    customer: {
      name: "Maria Silva",
      email: "maria@test.com",
      age: 28,
      active: true,
      addresses: [
        {
          street: "Rua A, 123",
          city: "São Paulo",
          location: {
            lat: -23,
            lng: -46,
            metadata: {
              source: "gps",
              accuracy: 10,
              tags: ["verified", "primary"],
              history: [
                {
                  timestamp: "2024-01-01",
                  value: 100,
                  details: {
                    reason: "initial",
                    codes: [1, 2, 3],
                    audit: {
                      by: "system",
                      level: 1,
                      flags: ["auto", "verified"],
                      nested: {
                        deep1: {
                          deep2: {
                            deep3: {
                              deep4: {
                                deep5: {
                                  value: "bottom-level-value",
                                  items: ["x", "y", "z"],
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    },
    items: [
      {
        productId: validUUID1,
        name: "Produto A",
        quantity: 2,
        tags: ["electronics", "sale"],
        variants: [
          {
            sku: "SKU-001",
            price: 9990,
            attributes: {
              color: "black",
              sizes: ["S", "M", "L"],
            },
          },
          {
            sku: "SKU-002",
            price: 12990,
            attributes: {
              color: "white",
              sizes: ["M", "L", "XL"],
            },
          },
        ],
      },
      {
        productId: validUUID2,
        name: "Produto B",
        quantity: 1,
        tags: ["books"],
        variants: [
          {
            sku: "SKU-003",
            price: 4990,
            attributes: {
              color: "blue",
              sizes: ["U"],
            },
          },
        ],
      },
    ],
    payment: {
      method: "credit_card",
      amount: 27970,
      installments: [
        { number: 1, value: 9324 },
        { number: 2, value: 9323 },
        { number: 3, value: 9323 },
      ],
    },
  };
}

// ── Aggregate Order ─────────────────────────────────────────────

class Order extends Aggregate<
  InferProps<typeof orderSchema>,
  InferJson<typeof orderSchema>
> {
  protected _classInfo: TClassInfo = {
    name: "Order",
    version: "1.0.0",
    description: "Aggregate de pedido complexo",
  };

  static create(data: InferJson<typeof orderSchema>): Result<Order, Exceptions> {
    const validator = SchemaBuilder.compile(orderSchema);
    const result = validator.create(data);
    if (isFailure(result)) return result;

    const order = new Order();
    order.id = result.value.id ?? FId.generate();
    Object.assign(order, result.value);
    return ok(order);
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe("SchemaBuilder — Stress test (15+ níveis)", () => {

  it("dados válidos completos passam validação", () => {
    const data = makeValidOrderData();
    const result = Order.create(data);
    assertSuccess(result);
    assert.ok(result.value.id);
  });

  it("toJSON() faz deep unwrap em 15 níveis", () => {
    const data = makeValidOrderData();
    const result = Order.create(data);
    assertSuccess(result);
    const json = result.value.toJSON();

    // Verifica que campos profundos foram unwrapped para primitivos
    assert.equal(typeof json.customer.name, "string");
    assert.equal(typeof json.customer.email, "string");
    assert.equal(typeof json.customer.age, "number");
    assert.equal(json.payment.method, "credit_card");
    assert.equal(json.payment.installments.length, 3);
    assert.equal(json.items.length, 2);
  });

  it("campo profundo inválido (nível 15) — deep5.value vazio", () => {
    const data = makeValidOrderData();
    data.customer.addresses[0].location.metadata.history[0].details.audit.nested.deep1.deep2.deep3.deep4.deep5.value = "";
    const result = createWithUntypedData(orderSchema, data);
    assertFailure(result);
    assert.ok(result.error.field);
    assert.ok(result.error.field.includes("deep5"));
  });

  it("item inválido dentro de array aninhado — variants[0].attributes.color vazio", () => {
    const data = makeValidOrderData();
    data.items[0].variants[0].attributes.color = "";
    const result = createWithUntypedData(orderSchema, data);
    assertFailure(result);
    assert.ok(result.error.field);
    assert.ok(result.error.field.includes("color"));
  });

  it("array de objetos com item inválido — history[0].details.reason vazio", () => {
    const data = makeValidOrderData();
    data.customer.addresses[0].location.metadata.history[0].details.reason = "";
    const result = createWithUntypedData(orderSchema, data);
    assertFailure(result);
    assert.ok(result.error.field);
    assert.ok(result.error.field.includes("reason"));
  });

  it("email inválido no customer rejeita", () => {
    const data = makeValidOrderData();
    data.customer.email = "invalid";
    const result = createWithUntypedData(orderSchema, data);
    assertFailure(result);
    assert.ok(result.error.field);
    assert.ok(result.error.field.includes("email"));
  });

  it("productId inválido em items[1] rejeita", () => {
    const data = makeValidOrderData();
    data.items[1].productId = "not-a-uuid";
    const result = createWithUntypedData(orderSchema, data);
    assertFailure(result);
  });

  it("array vazio de installments é aceito", () => {
    const data = makeValidOrderData();
    data.payment.installments = [];
    const result = Order.create(data);
    assertSuccess(result);
  });

  it("array vazio de tags é aceito", () => {
    const data = makeValidOrderData();
    data.items[0].tags = [];
    const result = Order.create(data);
    assertSuccess(result);
  });

  it("item inválido em array de códigos (codes) — decimal em FInt", () => {
    const data = makeValidOrderData();
    data.customer.addresses[0].location.metadata.history[0].details.codes = [1, 3.14, 3];
    const result = createWithUntypedData(orderSchema, data);
    assertFailure(result);
    assert.ok(result.error.field);
    assert.ok(result.error.field.includes("codes"));
  });

  it("string vazia em array de flags rejeita", () => {
    const data = makeValidOrderData();
    data.customer.addresses[0].location.metadata.history[0].details.audit.flags = ["ok", "", "fail"];
    const result = createWithUntypedData(orderSchema, data);
    assertFailure(result);
    assert.ok(result.error.field);
    assert.ok(result.error.field.includes("flags"));
  });

  it("múltiplos endereços válidos em addresses[]", () => {
    const data = makeValidOrderData();
    const addr2 = JSON.parse(JSON.stringify(data.customer.addresses[0]));
    addr2.street = "Rua B, 456";
    addr2.city = "Rio de Janeiro";
    data.customer.addresses.push(addr2);
    const result = Order.create(data);
    assertSuccess(result);
  });

  it("segundo endereço com campo inválido rejeita com path contendo street", () => {
    const data = makeValidOrderData();
    const addr2 = JSON.parse(JSON.stringify(data.customer.addresses[0]));
    addr2.street = "";
    data.customer.addresses.push(addr2);
    const result = createWithUntypedData(orderSchema, data);
    assertFailure(result);
    assert.ok(result.error.field);
    assert.ok(result.error.field.includes("street"));
  });

  it("compile() reutilizável com dados complexos", () => {
    const validator = SchemaBuilder.compile(orderSchema);
    const data1 = makeValidOrderData();
    const data2 = makeValidOrderData();
    data2.customer.name = "João";

    assertType<Parameters<typeof validator.create>[0]>(data1);
    assertType<Parameters<typeof validator.create>[0]>(data2);

    const r1 = validator.create(data1);
    const r2 = validator.create(data2);
    assertSuccess(r1);
    assertSuccess(r2);
  });

  it("customer ausente rejeita", () => {
    const result = createWithUntypedData(orderSchema, {
      items: [],
      payment: { method: "pix", amount: 100, installments: [] },
    });
    assertFailure(result);
  });

  it("payment ausente rejeita", () => {
    const data = makeValidOrderData();
    const partial = { customer: data.customer, items: data.items };
    const result = createWithUntypedData(orderSchema, partial);
    assertFailure(result);
  });

  it("items vazio é aceito", () => {
    const data = makeValidOrderData();
    data.items = [];
    const result = Order.create(data);
    assertSuccess(result);
  });

  it("toJSON() output é idêntico ao input (round-trip completo)", () => {
    const input = makeValidOrderData();
    const result = Order.create(input);
    assertSuccess(result);
    const output = result.value.toJSON();

    // Customer
    assert.equal(output.customer.name, input.customer.name);
    assert.equal(output.customer.email, input.customer.email);
    assert.equal(output.customer.age, input.customer.age);
    assert.equal(output.customer.active, input.customer.active);

    // Customer → addresses[0]
    assert.equal(output.customer.addresses[0].street, input.customer.addresses[0].street);
    assert.equal(output.customer.addresses[0].city, input.customer.addresses[0].city);

    // Customer → addresses[0] → location
    assert.equal(output.customer.addresses[0].location.lat, input.customer.addresses[0].location.lat);
    assert.equal(output.customer.addresses[0].location.lng, input.customer.addresses[0].location.lng);

    // Customer → addresses[0] → location → metadata
    assert.equal(output.customer.addresses[0].location.metadata.source, input.customer.addresses[0].location.metadata.source);
    assert.equal(output.customer.addresses[0].location.metadata.accuracy, input.customer.addresses[0].location.metadata.accuracy);
    assert.deepEqual(output.customer.addresses[0].location.metadata.tags, input.customer.addresses[0].location.metadata.tags);

    // Customer → addresses[0] → location → metadata → history[0]
    const outHistory = output.customer.addresses[0].location.metadata.history[0];
    const inHistory = input.customer.addresses[0].location.metadata.history[0];
    assert.equal(outHistory.timestamp, inHistory.timestamp);
    assert.equal(outHistory.value, inHistory.value);

    // history[0] → details
    assert.equal(outHistory.details.reason, inHistory.details.reason);
    assert.deepEqual(outHistory.details.codes, inHistory.details.codes);

    // history[0] → details → audit
    assert.equal(outHistory.details.audit.by, inHistory.details.audit.by);
    assert.equal(outHistory.details.audit.level, inHistory.details.audit.level);
    assert.deepEqual(outHistory.details.audit.flags, inHistory.details.audit.flags);

    // history[0] → details → audit → nested → deep1 → deep2 → deep3 → deep4 → deep5
    const outDeep = outHistory.details.audit.nested.deep1.deep2.deep3.deep4.deep5;
    const inDeep = inHistory.details.audit.nested.deep1.deep2.deep3.deep4.deep5;
    assert.equal(outDeep.value, inDeep.value);
    assert.deepEqual(outDeep.items, inDeep.items);

    // Items
    assert.equal(output.items.length, input.items.length);
    assert.equal(output.items[0].productId, input.items[0].productId);
    assert.equal(output.items[0].name, input.items[0].name);
    assert.equal(output.items[0].quantity, input.items[0].quantity);
    assert.deepEqual(output.items[0].tags, input.items[0].tags);

    // Items → variants
    assert.equal(output.items[0].variants.length, input.items[0].variants.length);
    assert.equal(output.items[0].variants[0].sku, input.items[0].variants[0].sku);
    assert.equal(output.items[0].variants[0].price, input.items[0].variants[0].price);
    assert.equal(output.items[0].variants[0].attributes.color, input.items[0].variants[0].attributes.color);
    assert.deepEqual(output.items[0].variants[0].attributes.sizes, input.items[0].variants[0].attributes.sizes);

    // Items[1]
    assert.equal(output.items[1].productId, input.items[1].productId);
    assert.equal(output.items[1].name, input.items[1].name);
    assert.equal(output.items[1].variants[0].sku, input.items[1].variants[0].sku);

    // Payment
    assert.equal(output.payment.method, input.payment.method);
    assert.equal(output.payment.amount, input.payment.amount);
    assert.equal(output.payment.installments.length, input.payment.installments.length);
    assert.equal(output.payment.installments[0].number, input.payment.installments[0].number);
    assert.equal(output.payment.installments[0].value, input.payment.installments[0].value);
    assert.equal(output.payment.installments[2].number, input.payment.installments[2].number);
    assert.equal(output.payment.installments[2].value, input.payment.installments[2].value);

    // output.id matches generated id
    assert.ok(output.id);
    assert.equal(typeof output.id, "string");
  });

  it("getValue() retorna primitivos corretos em todos os níveis", () => {
    const input = makeValidOrderData();
    const result = Order.create(input);
    assertSuccess(result);
    const order = result.value;

    // Nível 1 — id
    assert.ok(order.id);
    assert.equal(typeof order.id.getValue(), "string");

    // Nível 2 — customer fields (getValue via toJSON deep unwrap)
    const json = order.toJSON();
    assert.equal(json.customer.name, "Maria Silva");
    assert.equal(json.customer.email, "maria@test.com");
    assert.equal(json.customer.age, 28);
    assert.equal(json.customer.active, true);

    // Nível 15 — deep5
    const deep5 = json.customer.addresses[0].location.metadata.history[0].details.audit.nested.deep1.deep2.deep3.deep4.deep5;
    assert.equal(deep5.value, "bottom-level-value");
    assert.deepEqual(deep5.items, ["x", "y", "z"]);

    // Todos os tipos são primitivos (não TypeField instances)
    assert.equal(typeof json.customer.name, "string");
    assert.equal(typeof json.customer.age, "number");
    assert.equal(typeof json.customer.active, "boolean");
    assert.equal(typeof json.items[0].productId, "string");
    assert.equal(typeof json.items[0].quantity, "number");
    assert.equal(typeof json.payment.amount, "number");
  });

  it("erro de validação profundo tem status 400", () => {
    const data = makeValidOrderData();
    data.customer.addresses[0].location.metadata.history[0].details.audit.nested.deep1.deep2.deep3.deep4.deep5.value = "";
    const result = createWithUntypedData(orderSchema, data);
    assertFailure(result);
    assert.equal(result.error.status, 400);
  });

  it("múltiplos campos inválidos retorna primeiro erro encontrado", () => {
    const data = makeValidOrderData();
    data.customer.name = "";
    data.customer.email = "invalid";
    data.payment.method = "";
    const result = createWithUntypedData(orderSchema, data);
    assertFailure(result);
    // Retorna o PRIMEIRO erro — que é customer.name (processado antes de email e payment)
    assert.ok(result.error.field);
    assert.ok(result.error.field.includes("name"));
  });
});
