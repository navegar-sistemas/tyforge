import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { SchemaBuilder } from "@tyforge/schema/schema-build";
import { isSuccess, isFailure, Result } from "@tyforge/result/result";
import { FString } from "@tyforge/type-fields/primitive/string.typefield";
import { FEmail } from "@tyforge/type-fields/identity/email.typefield";
import { FInt } from "@tyforge/type-fields/primitive/int.typefield";
import { FBoolean } from "@tyforge/type-fields/primitive/boolean.typefield";
import { FId } from "@tyforge/type-fields/identity/id.typefield";
import type { ISchema } from "@tyforge/schema/schema-types";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";

// ── Helpers ─────────────────────────────────────────────────────

const validUUID = "019d0863-5d45-7246-b6d0-de5098bfd12e";

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

/** Testa cenários com dados intencionalmente inválidos para validação runtime */
function createWithUntypedData<T extends ISchema>(
  schema: T,
  data: unknown,
): Result<Record<string, unknown>, Exceptions> {
  const validator = SchemaBuilder.compile(schema);
  const result = validator.create(
    data as Parameters<typeof validator.create>[0],
  );
  return result as Result<Record<string, unknown>, Exceptions>;
}

// ── 1. Campo simples válido ─────────────────────────────────────

describe("SchemaBuilder — campos simples válidos", () => {
  it("valida FString", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ name: "Maria" });
    assertSuccess(result);
    assert.equal(result.value.name.getValue(), "Maria");
  });

  it("valida FEmail", () => {
    const schema = { email: { type: FEmail } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ email: "maria@test.com" });
    assertSuccess(result);
    assert.equal(result.value.email.getValue(), "maria@test.com");
  });

  it("valida FInt", () => {
    const schema = { age: { type: FInt } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ age: 28 });
    assertSuccess(result);
    assert.equal(result.value.age.getValue(), 28);
  });

  it("valida FBoolean", () => {
    const schema = { active: { type: FBoolean } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ active: true });
    assertSuccess(result);
    assert.equal(result.value.active.getValue(), true);
  });

  it("valida FId", () => {
    const schema = { id: { type: FId } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ id: validUUID });
    assertSuccess(result);
    assert.equal(result.value.id.getValue(), validUUID);
  });

  it("valida FBoolean com false", () => {
    const schema = { active: { type: FBoolean } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ active: false });
    assertSuccess(result);
    assert.equal(result.value.active.getValue(), false);
  });

  it("FBoolean rejects non-boolean types (no coercion)", () => {
    const schema = { active: { type: FBoolean } } satisfies ISchema;
    // FBoolean accepts ONLY boolean -- no string/number coercion
    const r1 = createWithUntypedData(schema, { active: "true" });
    const r2 = createWithUntypedData(schema, { active: 1 });
    const r3 = createWithUntypedData(schema, { active: "false" });
    const r4 = createWithUntypedData(schema, { active: 0 });
    assertFailure(r1);
    assertFailure(r2);
    assertFailure(r3);
    assertFailure(r4);
  });

  it("FInt aceita zero", () => {
    const schema = { count: { type: FInt } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ count: 0 });
    assertSuccess(result);
    assert.equal(result.value.count.getValue(), 0);
  });

  it("FInt aceita números negativos", () => {
    const schema = { count: { type: FInt } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ count: -100 });
    assertSuccess(result);
    assert.equal(result.value.count.getValue(), -100);
  });

  it("campos extras no input são ignorados", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const result = createWithUntypedData(schema, {
      name: "Maria",
      extra: "ignored",
      another: 123,
    });
    assertSuccess(result);
    assert.ok("name" in result.value);
  });
});

// ── 2. Campos required / optional ───────────────────────────────

describe("SchemaBuilder — required / optional", () => {
  it("campo required ausente retorna erro", () => {
    const schema = {
      name: { type: FString, required: true },
    } satisfies ISchema;
    const result = createWithUntypedData(schema, {});
    assertFailure(result);
    assert.equal(result.error.field, "name");
  });

  it("campo required: false ausente é aceito", () => {
    const schema = {
      name: { type: FString, required: false },
    } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({});
    assertSuccess(result);
    assert.equal(result.value.name, undefined);
  });

  it("campo required com valor null retorna erro", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const result = createWithUntypedData(schema, { name: null });
    assertFailure(result);
  });

  it("campo required por padrão (sem especificar required)", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const result = createWithUntypedData(schema, {});
    assertFailure(result);
  });

  it("schema com todos os campos optional aceita objeto vazio", () => {
    const schema = {
      name: { type: FString, required: false },
      age: { type: FInt, required: false },
    } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({});
    assertSuccess(result);
    assert.equal(result.value.name, undefined);
    assert.equal(result.value.age, undefined);
  });
});

// ── 3. Validação de formato ─────────────────────────────────────

describe("SchemaBuilder — validação de formato", () => {
  it("email sem @ falha", () => {
    const schema = { email: { type: FEmail } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ email: "invalido" });
    assertFailure(result);
  });

  it("string vazia falha em FString (minLength: 1)", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ name: "" });
    assertFailure(result);
  });

  it("número com decimal falha em FInt", () => {
    const schema = { count: { type: FInt } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ count: 3.14 });
    assertFailure(result);
  });

  it("UUID inválido falha em FId", () => {
    const schema = { id: { type: FId } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ id: "not-a-uuid" });
    assertFailure(result);
  });

  it("erro de validação tem status 400", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ name: "" });
    assertFailure(result);
    assert.equal(result.error.status, 400);
  });

  it("erro de validação tem detail descritivo", () => {
    const schema = { email: { type: FEmail } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ email: "bad" });
    assertFailure(result);
    assert.ok(result.error.detail.length > 0);
  });

  it("FString rejeita número como input", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const result = createWithUntypedData(schema, { name: 123 });
    assertFailure(result);
  });

  it("FInt rejeita string como input", () => {
    const schema = { count: { type: FInt } } satisfies ISchema;
    const result = createWithUntypedData(schema, { count: "abc" });
    assertFailure(result);
  });

  it("FBoolean rejects any string (no coercion)", () => {
    const schema = { active: { type: FBoolean } } satisfies ISchema;
    const result = createWithUntypedData(schema, { active: "maybe" });
    assertFailure(result);
  });

  it("FString with only spaces fails (trims before validation)", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ name: "   " });
    assertFailure(result);
  });
});

// ── 4. Objetos nested ───────────────────────────────────────────

describe("SchemaBuilder — nested objects", () => {
  it("valida objeto nested 1 nível", () => {
    const schema = {
      user: {
        name: { type: FString },
        email: { type: FEmail },
      },
    } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({
      user: { name: "Ana", email: "ana@test.com" },
    });
    assertSuccess(result);
  });

  it("valida objeto nested 3 níveis", () => {
    const schema = {
      level1: {
        level2: {
          level3: {
            value: { type: FString },
          },
        },
      },
    } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({
      level1: { level2: { level3: { value: "deep" } } },
    });
    assertSuccess(result);
  });

  it("erro em nested inclui path completo", () => {
    const schema = {
      user: {
        address: {
          street: { type: FString },
        },
      },
    } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ user: { address: { street: "" } } });
    assertFailure(result);
    assert.ok(result.error.field?.includes("street"));
  });

  it("nested ausente retorna erro", () => {
    const schema = {
      user: {
        name: { type: FString },
      },
    } satisfies ISchema;
    const result = createWithUntypedData(schema, {});
    assertFailure(result);
  });
});

// ── 5. Arrays ───────────────────────────────────────────────────

describe("SchemaBuilder — arrays", () => {
  it("array com isArray: true válido", () => {
    const schema = { tags: { type: FString, isArray: true } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ tags: ["node", "typescript"] });
    assertSuccess(result);
    assert.equal(result.value.tags.length, 2);
  });

  it("array syntax [{ type }] válido", () => {
    const schema = { tags: [{ type: FString }] } satisfies ISchema;
    const result = createWithUntypedData(schema, { tags: ["a", "b", "c"] });
    assertSuccess(result);
    assert.ok("tags" in result.value);
    if (Array.isArray(result.value.tags)) {
      assert.equal(result.value.tags.length, 3);
    } else {
      assert.fail("tags deveria ser array");
    }
  });

  it("array vazio é aceito", () => {
    const schema = { tags: { type: FString, isArray: true } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const emptyTags: string[] = [];
    const result = validator.create({ tags: emptyTags });
    assertSuccess(result);
    assert.equal(result.value.tags.length, 0);
  });

  it("item inválido no array retorna erro com path indexado", () => {
    const schema = { tags: { type: FString, isArray: true } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ tags: ["valid", "", "also-valid"] });
    assertFailure(result);
    assert.ok(result.error.field?.includes("[1]"));
  });

  it("valor simples onde espera array retorna erro", () => {
    const schema = { tags: { type: FString, isArray: true } } satisfies ISchema;
    const result = createWithUntypedData(schema, { tags: "not-an-array" });
    assertFailure(result);
  });
});

// ── 6. compile() reutilizável ───────────────────────────────────

describe("SchemaBuilder — compile reutilizável", () => {
  it("múltiplas chamadas create() funcionam", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);

    const r1 = validator.create({ name: "Ana" });
    const r2 = validator.create({ name: "João" });
    const r3 = validator.create({ name: "" });

    assertSuccess(r1);
    assertSuccess(r2);
    assertFailure(r3);
    assert.equal(r1.value.name.getValue(), "Ana");
    assert.equal(r2.value.name.getValue(), "João");
  });

  it("create() e assign() são independentes", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const validator = SchemaBuilder.compile(schema);

    const r1 = validator.create({ name: "Test" });
    const r2 = validator.assign({ name: "Test" });

    assert.ok(isSuccess(r1));
    assert.ok(isSuccess(r2));
  });
});

// ── 7. Schema complexo (integração) ────────────────────────────

describe("SchemaBuilder — schema complexo", () => {
  it("schema com todos os tipos — dados válidos", () => {
    const schema = {
      id: { type: FId, required: false },
      name: { type: FString },
      email: { type: FEmail },
      age: { type: FInt },
      active: { type: FBoolean },
      tags: { type: FString, isArray: true },
      address: {
        street: { type: FString },
        city: { type: FString },
      },
    } satisfies ISchema;

    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({
      name: "Maria Silva",
      email: "maria@test.com",
      age: 28,
      active: true,
      tags: ["admin", "user"],
      address: { street: "Rua X, 123", city: "São Paulo" },
    });

    assertSuccess(result);
    assert.equal(result.value.name.getValue(), "Maria Silva");
    assert.equal(result.value.email.getValue(), "maria@test.com");
    assert.equal(result.value.age.getValue(), 28);
    assert.equal(result.value.active.getValue(), true);
    assert.equal(result.value.tags.length, 2);
    assert.equal(result.value.id, undefined);
  });

  it("schema complexo — primeiro erro encontrado retorna", () => {
    const schema = {
      name: { type: FString },
      email: { type: FEmail },
    } satisfies ISchema;

    const validator = SchemaBuilder.compile(schema);
    const result = validator.create({ name: "", email: "invalido" });
    assertFailure(result);
    // Retorna o primeiro erro (name vazio), não todos
    assert.ok(result.error.field?.includes("name"));
  });
});

// ── 8. Dados completamente inválidos ────────────────────────────

describe("SchemaBuilder — dados inválidos", () => {
  it("null como data retorna erro", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const result = createWithUntypedData(schema, null);
    assertFailure(result);
  });

  it("undefined como data retorna erro", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const result = createWithUntypedData(schema, undefined);
    assertFailure(result);
  });

  it("número como data retorna erro", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const result = createWithUntypedData(schema, 42);
    assertFailure(result);
  });

  it("string como data retorna erro", () => {
    const schema = { name: { type: FString } } satisfies ISchema;
    const result = createWithUntypedData(schema, "invalid");
    assertFailure(result);
  });
});
