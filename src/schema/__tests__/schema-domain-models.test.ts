import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { SchemaBuilder } from "@tyforge/schema/schema-build";
import { isSuccess, isFailure, ok, Result } from "@tyforge/result/result";
import { FString } from "@tyforge/type-fields/string.format_vo";
import { FEmail } from "@tyforge/type-fields/email.format_vo";
import { FInt } from "@tyforge/type-fields/int.format_vo";
import { FId } from "@tyforge/type-fields/id.format_vo";
import { Aggregate } from "@tyforge/domain-models/agreggate.base";
import { ValueObject } from "@tyforge/domain-models/value-object.base";
import { DomainEvent } from "@tyforge/domain-models/domain-event.base";
import { Exceptions } from "@tyforge/exceptions/base.exceptions";
import { InferProps, InferJson, Schema } from "@tyforge/schema/schema-types";
import { TClassInfo } from "@tyforge/domain-models/class.base";

// ── Helpers ─────────────────────────────────────────────────────

function assertSuccess<T, E>(result: Result<T, E>): asserts result is { success: true; value: T } {
  if (!isSuccess(result)) {
    assert.fail(`Expected success but got failure: ${JSON.stringify(result.error)}`);
  }
}

function assertFailure<T, E>(result: Result<T, E>): asserts result is { success: false; error: E } {
  if (!isFailure(result)) {
    assert.fail(`Expected failure but got success`);
  }
}

// ── Schema definitions ──────────────────────────────────────────

const addressSchema = {
  street: { type: FString, required: true },
  city: { type: FString, required: true },
} satisfies Schema;

const userSchema = {
  id: { type: FId, required: false },
  name: { type: FString, required: true },
  email: { type: FEmail, required: true },
  age: { type: FInt, required: false },
} satisfies Schema;

// ── Domain Models ───────────────────────────────────────────────

class Address extends ValueObject<
  InferProps<typeof addressSchema>,
  InferJson<typeof addressSchema>
> {
  protected _classInfo: TClassInfo = {
    name: "Address",
    version: "1.0.0",
    description: "Endereço",
  };

  declare street: FString;
  declare city: FString;

  equals(input: Address): boolean {
    return JSON.stringify(this.toJSON()) === JSON.stringify(input.toJSON());
  }

  static create(data: InferJson<typeof addressSchema>): Result<Address, Exceptions> {
    const validator = SchemaBuilder.compile(addressSchema);
    const result = validator.create(data);
    if (isFailure(result)) return result;

    const address = new Address();
    address.street = result.value.street;
    address.city = result.value.city;
    return ok(address);
  }
}

interface UserCreatedPayload extends Record<string, unknown> { userId: string; email: string }

class UserCreated extends DomainEvent<UserCreatedPayload> {
  readonly queueName = "user-events";
}

class User extends Aggregate<
  InferProps<typeof userSchema>,
  InferJson<typeof userSchema>
> {
  protected _classInfo: TClassInfo = {
    name: "User",
    version: "1.0.0",
    description: "Aggregate de usuário",
  };

  declare name: FString;
  declare email: FEmail;
  declare age: FInt | undefined;

  static create(data: InferJson<typeof userSchema>): Result<User, Exceptions> {
    const validator = SchemaBuilder.compile(userSchema);
    const result = validator.create(data);
    if (isFailure(result)) return result;

    const user = new User();
    user.id = result.value.id ?? FId.generate();
    user.name = result.value.name;
    user.email = result.value.email;
    user.age = result.value.age;

    user.addDomainEvent(new UserCreated("user.created", {
      userId: user.id.getValue(),
      email: user.email.getValue(),
    }));

    return ok(user);
  }
}

// ── Tests ───────────────────────────────────────────────────────

describe("SchemaBuilder + ValueObject", () => {
  it("cria ValueObject com dados válidos", () => {
    const result = Address.create({ street: "Rua X, 123", city: "São Paulo" });
    assertSuccess(result);
    assert.equal(result.value.street.getValue(), "Rua X, 123");
    assert.equal(result.value.city.getValue(), "São Paulo");
  });

  it("rejeita ValueObject com dados inválidos", () => {
    const result = Address.create({ street: "", city: "São Paulo" });
    assertFailure(result);
  });

  it("toJSON() faz deep unwrap dos TypeFields", () => {
    const result = Address.create({ street: "Rua Y", city: "Rio" });
    assertSuccess(result);
    const json = result.value.toJSON();
    assert.equal(json.street, "Rua Y");
    assert.equal(json.city, "Rio");
    assert.equal(typeof json.street, "string");
  });

  it("equals() compara estruturalmente", () => {
    const a1 = Address.create({ street: "Rua A", city: "SP" });
    const a2 = Address.create({ street: "Rua A", city: "SP" });
    const a3 = Address.create({ street: "Rua B", city: "SP" });
    assertSuccess(a1);
    assertSuccess(a2);
    assertSuccess(a3);
    assert.ok(a1.value.equals(a2.value));
    assert.ok(!a1.value.equals(a3.value));
  });
});

describe("SchemaBuilder + Aggregate", () => {
  it("cria Aggregate com dados válidos", () => {
    const result = User.create({ name: "Maria", email: "maria@test.com" });
    assertSuccess(result);
    assert.equal(result.value.name.getValue(), "Maria");
    assert.equal(result.value.email.getValue(), "maria@test.com");
    assert.ok(result.value.id);
    assert.equal(typeof result.value.id.getValue(), "string");
  });

  it("rejeita Aggregate com email inválido", () => {
    const result = User.create({ name: "Maria", email: "invalido" });
    assertFailure(result);
  });

  it("rejeita Aggregate com nome vazio", () => {
    const result = User.create({ name: "", email: "maria@test.com" });
    assertFailure(result);
  });

  it("campo optional ausente é undefined no Aggregate", () => {
    const result = User.create({ name: "Ana", email: "ana@test.com" });
    assertSuccess(result);
    assert.equal(result.value.age, undefined);
  });

  it("campo optional presente é validado", () => {
    const result = User.create({ name: "Ana", email: "ana@test.com", age: 25 });
    assertSuccess(result);
    assert.ok(result.value.age);
    assert.equal(result.value.age.getValue(), 25);
  });

  it("toJSON() faz deep unwrap do Aggregate", () => {
    const result = User.create({ name: "João", email: "joao@test.com", age: 30 });
    assertSuccess(result);
    const json = result.value.toJSON();
    assert.equal(json.name, "João");
    assert.equal(json.email, "joao@test.com");
    assert.equal(json.age, 30);
    assert.equal(typeof json.id, "string");
  });

  it("toJSON() omite age quando undefined", () => {
    const result = User.create({ name: "Ana", email: "ana@test.com" });
    assertSuccess(result);
    const json = result.value.toJSON();
    assert.equal(json.age, undefined);
  });
});

describe("SchemaBuilder + DomainEvent", () => {
  it("Aggregate emite domain event na criação", () => {
    const result = User.create({ name: "Maria", email: "maria@test.com" });
    assertSuccess(result);
    const events = result.value.getDomainEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0].eventName, "user.created");
  });

  it("domain event tem payload correto", () => {
    const result = User.create({ name: "Maria", email: "maria@test.com" });
    assertSuccess(result);
    const event = result.value.getDomainEvents()[0];
    assert.ok("email" in event.payload);
    assert.ok("userId" in event.payload);
    assert.equal(event.payload.email, "maria@test.com");
    assert.equal(typeof event.payload.userId, "string");
  });

  it("domain event tem id, occurredAt e version", () => {
    const result = User.create({ name: "Test", email: "test@test.com" });
    assertSuccess(result);
    const event = result.value.getDomainEvents()[0];
    assert.ok(event.id);
    assert.ok(event.occurredAt instanceof Date);
    assert.equal(event.version, "1.0.0");
  });

  it("clearDomainEvents() limpa os eventos", () => {
    const result = User.create({ name: "Test", email: "test@test.com" });
    assertSuccess(result);
    assert.equal(result.value.getDomainEvents().length, 1);
    result.value.clearDomainEvents();
    assert.equal(result.value.getDomainEvents().length, 0);
  });

  it("toJSON() do DomainEvent serializa corretamente", () => {
    const result = User.create({ name: "Test", email: "test@test.com" });
    assertSuccess(result);
    const eventJson = result.value.getDomainEvents()[0].toJSON();
    assert.equal(eventJson.eventName, "user.created");
    assert.equal(eventJson.queueName, "user-events");
    assert.equal(typeof eventJson.occurredAt, "string");
  });

  it("getDomainEvents() retorna array imutável", () => {
    const result = User.create({ name: "Test", email: "test@test.com" });
    assertSuccess(result);
    const events = result.value.getDomainEvents();
    assert.ok(Object.isFrozen(events));
  });

  it("domain events são isolados por instância", () => {
    const r1 = User.create({ name: "Ana", email: "ana@test.com" });
    const r2 = User.create({ name: "Bob", email: "bob@test.com" });
    assertSuccess(r1);
    assertSuccess(r2);
    assert.equal(r1.value.getDomainEvents().length, 1);
    assert.equal(r2.value.getDomainEvents().length, 1);
    r1.value.clearDomainEvents();
    assert.equal(r1.value.getDomainEvents().length, 0);
    assert.equal(r2.value.getDomainEvents().length, 1);
  });
});

describe("SchemaBuilder + Entity equals", () => {
  it("dois Aggregates com mesmo id são iguais", () => {
    const r1 = User.create({ name: "Maria", email: "maria@test.com" });
    assertSuccess(r1);
    const r2 = User.create({ name: "João", email: "joao@test.com" });
    assertSuccess(r2);

    // Forçar mesmo id
    r2.value.id = r1.value.id;
    assert.ok(r1.value.equals(r2.value));
  });

  it("dois Aggregates com ids diferentes não são iguais", () => {
    const r1 = User.create({ name: "Maria", email: "maria@test.com" });
    const r2 = User.create({ name: "Maria", email: "maria@test.com" });
    assertSuccess(r1);
    assertSuccess(r2);
    assert.ok(!r1.value.equals(r2.value));
  });
});

describe("SchemaBuilder + Schema reutilizável", () => {
  it("mesmo schema compila uma vez e valida múltiplos Aggregates", () => {
    const r1 = User.create({ name: "Ana", email: "ana@test.com" });
    const r2 = User.create({ name: "Bob", email: "bob@test.com" });
    const r3 = User.create({ name: "", email: "bad" });

    assertSuccess(r1);
    assertSuccess(r2);
    assertFailure(r3);
  });
});
