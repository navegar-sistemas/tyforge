import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import {
  FString, FEmail, FInt, FBoolean, FId, FAppStatus, FHttpStatus,
  OAppStatus, OHttpStatus,
  SchemaBuilder,
  ok, err, isSuccess, isFailure, map, flatMap, fold, match, getOrElse, orElse, all, OK_TRUE, OK_FALSE,
  Exceptions, ExceptionValidation, ExceptionBusiness, ExceptionOptimisticLock,
  ValueObject, Entity, Aggregate, DtoReq, DtoRes, DomainEvent, UseCase, Paginated,
} from "@tyforge/index";
import type {
  ISchema, InferProps, InferJson, Result,
  TDtoReqProps, TDtoReqPropsJson, TDtoResProps, TDtoResPropsJson,
  IRepositoryBase, ResultPromise, IPaginationParams,
} from "@tyforge/index";

// ── Helpers ─────────────────────────────────────────────────────

function assertSuccess<T, E>(result: Result<T, E>): asserts result is { success: true; value: T } {
  if (!isSuccess(result)) assert.fail(`Expected success but got failure: ${JSON.stringify(result.error)}`);
}

function assertFailure<T, E>(result: Result<T, E>): asserts result is { success: false; error: E } {
  if (!isFailure(result)) assert.fail(`Expected failure but got success`);
}

// ── 01: TypeFields básicos ──────────────────────────────────────

describe("01 — TypeFields básicos", () => {
  it("FString.create com valor válido", () => {
    const result = FString.create("Maria");
    assertSuccess(result);
    assert.equal(result.value.getValue(), "Maria");
    assert.equal(result.value.toJSON(), "Maria");
  });

  it("FString.create com string vazia falha", () => {
    const result = FString.create("");
    assertFailure(result);
  });

  it("FEmail.create com email válido", () => {
    const result = FEmail.create("maria@test.com");
    assertSuccess(result);
    assert.equal(result.value.getValue(), "maria@test.com");
  });

  it("FEmail.create com email inválido falha", () => {
    const result = FEmail.create("invalido");
    assertFailure(result);
    assert.ok(result.error.field);
  });

  it("FInt.create com número válido", () => {
    const result = FInt.create(28);
    assertSuccess(result);
    assert.equal(result.value.getValue(), 28);
  });

  it("FBoolean accepts only boolean (no coercion)", () => {
    const fromTrue = FBoolean.create(true);
    const fromFalse = FBoolean.create(false);
    assertSuccess(fromTrue);
    assertSuccess(fromFalse);
    assert.equal(fromTrue.value.getValue(), true);
    assert.equal(fromFalse.value.getValue(), false);
  });

  it("FId.generate cria UUID válido", () => {
    const id = FId.generate();
    assert.ok(id.getValue());
    assert.equal(typeof id.getValue(), "string");
  });

  it("FId.create com UUID válido", () => {
    const result = FId.create("019d0863-5d45-7246-b6d0-de5098bfd12e");
    assertSuccess(result);
  });

  it("createOrThrow retorna instância", () => {
    const name = FString.createOrThrow("Joao");
    assert.equal(name.getValue(), "Joao");
  });

  it("createOrThrow com valor inválido lança", () => {
    assert.throws(() => FString.createOrThrow(""));
  });
});

// ── 02: TypeField Enum ──────────────────────────────────────────

describe("02 — TypeField Enum", () => {
  it("FAppStatus.create com valor válido", () => {
    const result = FAppStatus.create("active");
    assertSuccess(result);
    assert.equal(result.value.getValue(), "active");
    assert.equal(result.value.isActive(), true);
  });

  it("FAppStatus.create<unknown> rejects invalid value", () => {
    const result = FAppStatus.create<unknown>("deleted", "status");
    assertFailure(result);
  });

  it("FHttpStatus.create com código válido", () => {
    const result = FHttpStatus.create(200);
    assertSuccess(result);
    assert.equal(result.value.getValue(), 200);
  });

  it("OHttpStatus expõe constantes", () => {
    assert.equal(OHttpStatus.OK, 200);
    assert.equal(OHttpStatus.NOT_FOUND, 404);
  });
});

// ── 03: Schema validação ────────────────────────────────────────

describe("03 — Schema validação", () => {
  const userSchema = {
    id: { type: FId, required: false },
    name: { type: FString, required: true },
    email: { type: FEmail, required: true },
    age: { type: FInt, required: false },
  } satisfies ISchema;

  const validator = SchemaBuilder.compile(userSchema);

  it("valida dados válidos", () => {
    const result = validator.create({ name: "Maria", email: "maria@test.com", age: 28 });
    assertSuccess(result);
    assert.equal(result.value.name.getValue(), "Maria");
    assert.equal(result.value.email.getValue(), "maria@test.com");
    assert.equal(result.value.age?.getValue(), 28);
    assert.equal(result.value.id, undefined);
  });

  it("rejeita dados inválidos", () => {
    const result = validator.create({ name: "", email: "bad" });
    assertFailure(result);
    assert.equal(result.error.status, 400);
  });

  it("validator é reutilizável", () => {
    const r1 = validator.create({ name: "A", email: "a@a.com" });
    const r2 = validator.create({ name: "B", email: "b@b.com" });
    assertSuccess(r1);
    assertSuccess(r2);
  });
});

// ── 04: Schema nested + arrays ──────────────────────────────────

describe("04 — Schema nested + arrays", () => {
  const orderSchema = {
    customer: { name: { type: FString }, email: { type: FEmail } },
    items: { type: { name: { type: FString }, quantity: { type: FInt } }, isArray: true },
    tags: { type: FString, isArray: true },
  } satisfies ISchema;

  const validator = SchemaBuilder.compile(orderSchema);

  it("valida nested com arrays", () => {
    const result = validator.create({
      customer: { name: "Maria", email: "maria@test.com" },
      items: [{ name: "Produto A", quantity: 2 }],
      tags: ["urgente"],
    });
    assertSuccess(result);
    assert.equal(result.value.customer.name.getValue(), "Maria");
    assert.equal(result.value.items[0].name.getValue(), "Produto A");
    assert.equal(result.value.tags[0].getValue(), "urgente");
  });

  it("rejeita item inválido no array", () => {
    const result = validator.create({
      customer: { name: "Ana", email: "ana@test.com" },
      items: [{ name: "", quantity: 1 }],
      tags: ["ok"],
    });
    assertFailure(result);
  });
});

// ── 05: ValueObject ─────────────────────────────────────────────

describe("05 — ValueObject", () => {
  const addressSchema = {
    street: { type: FString },
    city: { type: FString },
    number: { type: FInt },
    complement: { type: FString, required: false },
  } satisfies ISchema;

  type TAddressProps = InferProps<typeof addressSchema>;
  type TAddressJson = InferJson<typeof addressSchema>;
  const addressValidator = SchemaBuilder.compile(addressSchema);

  class Address extends ValueObject<TAddressProps, TAddressJson> implements TAddressProps {
    readonly street: FString;
    readonly city: FString;
    readonly number: FInt;
    readonly complement: FString | undefined;
    protected readonly _classInfo = { name: "Address", version: "1.0.0", description: "Endereço" };

    private constructor(props: TAddressProps) {
      super();
      this.street = props.street;
      this.city = props.city;
      this.number = props.number;
      this.complement = props.complement;
    }

    static create(street: FString, city: FString, number?: FInt): Result<Address, Exceptions> {
      return ok(new Address({ street, city, number: number ?? FInt.createOrThrow(0), complement: undefined }));
    }

    static assign(data: TAddressJson): Result<Address, Exceptions> {
      const result = addressValidator.assign(data);
      if (isFailure(result)) return result;
      return ok(new Address(result.value));
    }
  }

  it("cria ValueObject com dados válidos", () => {
    const addr = Address.create(FString.createOrThrow("Rua X"), FString.createOrThrow("SP"), FInt.createOrThrow(123));
    assertSuccess(addr);
    assert.equal(addr.value.street.getValue(), "Rua X");
    assert.equal(addr.value.number.getValue(), 123);
  });

  it("toJSON() faz deep unwrap", () => {
    const addr = Address.create(FString.createOrThrow("Rua Y"), FString.createOrThrow("RJ"));
    assertSuccess(addr);
    const json = addr.value.toJSON();
    assert.equal(json.street, "Rua Y");
    assert.equal(json.number, 0);
    assert.equal(typeof json.street, "string");
  });

  it("equals() compara por valor", () => {
    const a1 = Address.create(FString.createOrThrow("Rua A"), FString.createOrThrow("SP"));
    const a2 = Address.create(FString.createOrThrow("Rua A"), FString.createOrThrow("SP"));
    assertSuccess(a1);
    assertSuccess(a2);
    assert.ok(a1.value.equals(a2.value));
  });

  it("assign() hidrata do banco", () => {
    const result = Address.assign({ street: "Rua Z", city: "BH", number: 789 });
    assertSuccess(result);
    assert.equal(result.value.city.getValue(), "BH");
  });
});

// ── 06: Entity ──────────────────────────────────────────────────

describe("06 — Entity", () => {
  const userSchema = {
    id: { type: FId, required: false },
    name: { type: FString },
    email: { type: FEmail },
    role: { type: FString },
  } satisfies ISchema;

  type TUserProps = InferProps<typeof userSchema>;
  type TUserJson = InferJson<typeof userSchema>;
  const userValidator = SchemaBuilder.compile(userSchema);

  class UserEntity extends Entity<TUserProps, TUserJson> implements TUserProps {
    readonly id: FId | undefined;
    readonly name: FString;
    readonly email: FEmail;
    readonly role: FString;
    protected readonly _classInfo = { name: "User", version: "1.0.0", description: "Usuário" };

    private constructor(props: TUserProps) {
      super();
      this.id = props.id;
      this.name = props.name;
      this.email = props.email;
      this.role = props.role;
    }

    static create(name: FString, email: FEmail): Result<UserEntity, Exceptions> {
      const domain = email.getValue().split("@")[1];
      if (domain === "admin.internal") {
        return err(ExceptionBusiness.invalidBusinessRule("emails @admin.internal bloqueados"));
      }
      return ok(new UserEntity({ id: FId.generate(), name, email, role: FString.createOrThrow("user") }));
    }

    static assign(data: TUserJson): Result<UserEntity, Exceptions> {
      const result = userValidator.assign(data);
      if (isFailure(result)) return result;
      return ok(new UserEntity(result.value));
    }
  }

  it("cria Entity com id gerado", () => {
    const result = UserEntity.create(FString.createOrThrow("Maria"), FEmail.createOrThrow("maria@test.com"));
    assertSuccess(result);
    assert.ok(result.value.id);
    assert.equal(result.value.role.getValue(), "user");
  });

  it("regra de negócio rejeita email corporativo", () => {
    const result = UserEntity.create(FString.createOrThrow("Admin"), FEmail.createOrThrow("admin@admin.internal"));
    assertFailure(result);
  });

  it("entities com ids diferentes não são iguais", () => {
    const u1 = UserEntity.create(FString.createOrThrow("A"), FEmail.createOrThrow("a@a.com"));
    const u2 = UserEntity.create(FString.createOrThrow("B"), FEmail.createOrThrow("b@b.com"));
    assertSuccess(u1);
    assertSuccess(u2);
    assert.ok(!u1.value.equals(u2.value));
  });

  it("assign() hidrata do banco", () => {
    const result = UserEntity.assign({ id: "019d0863-5d45-7246-b6d0-de5098bfd12e", name: "João", email: "joao@test.com", role: "admin" });
    assertSuccess(result);
    assert.equal(result.value.name.getValue(), "João");
  });
});

// ── 07: Aggregate + DomainEvent ─────────────────────────────────

describe("07 — Aggregate + DomainEvent", () => {
  interface TEventPayload extends Record<string, unknown> { orderId: string; total: number }

  class EventOrderTest extends DomainEvent<TEventPayload> {
    readonly queueName = "test-events";
    static create(payload: TEventPayload): EventOrderTest {
      return new EventOrderTest("order.created", payload);
    }
  }

  const orderSchema = {
    id: { type: FId, required: false },
    total: { type: FInt },
    status: { type: FAppStatus },
  } satisfies ISchema;

  type TOrderProps = InferProps<typeof orderSchema>;
  type TOrderJson = InferJson<typeof orderSchema>;
  const orderValidator = SchemaBuilder.compile(orderSchema);

  class OrderAggregate extends Aggregate<TOrderProps, TOrderJson> implements TOrderProps {
    readonly id: FId | undefined;
    readonly total: FInt;
    readonly status: FAppStatus;
    protected readonly _classInfo = { name: "Order", version: "1.0.0", description: "Pedido" };

    private constructor(props: TOrderProps) {
      super();
      this.id = props.id;
      this.total = props.total;
      this.status = props.status;
    }

    static create(total: FInt): Result<OrderAggregate, Exceptions> {
      if (total.getValue() < 1000) return err(ExceptionBusiness.invalidBusinessRule("mínimo R$ 10"));
      const id = FId.generate();
      const order = new OrderAggregate({ id, total, status: FAppStatus.createOrThrow(OAppStatus.ACTIVE) });
      order.addDomainEvent(EventOrderTest.create({ orderId: id.getValue(), total: total.getValue() }));
      return ok(order);
    }

    static assign(data: TOrderJson): Result<OrderAggregate, Exceptions> {
      const result = orderValidator.assign(data);
      if (isFailure(result)) return result;
      return ok(new OrderAggregate(result.value));
    }
  }

  it("cria Aggregate com domain event", () => {
    const result = OrderAggregate.create(FInt.createOrThrow(5000));
    assertSuccess(result);
    const events = result.value.getDomainEvents();
    assert.equal(events.length, 1);
    assert.equal(events[0].eventName, "order.created");
  });

  it("domain event tem payload correto", () => {
    const result = OrderAggregate.create(FInt.createOrThrow(2000));
    assertSuccess(result);
    const event = result.value.getDomainEvents()[0];
    assert.equal(event.payload.total, 2000);
    assert.equal(typeof event.payload.orderId, "string");
  });

  it("clearDomainEvents() limpa eventos", () => {
    const result = OrderAggregate.create(FInt.createOrThrow(3000));
    assertSuccess(result);
    result.value.clearDomainEvents();
    assert.equal(result.value.getDomainEvents().length, 0);
  });

  it("regra de negócio rejeita total baixo", () => {
    const result = OrderAggregate.create(FInt.createOrThrow(500));
    assertFailure(result);
  });

  it("assign() hidrata do banco", () => {
    const result = OrderAggregate.assign({ id: "019d0863-5d45-7246-b6d0-de5098bfd12e", total: 5000, status: "active" });
    assertSuccess(result);
    assert.equal(result.value.total.getValue(), 5000);
  });

  it("domain events isolados por instância", () => {
    const r1 = OrderAggregate.create(FInt.createOrThrow(1000));
    const r2 = OrderAggregate.create(FInt.createOrThrow(2000));
    assertSuccess(r1);
    assertSuccess(r2);
    r1.value.clearDomainEvents();
    assert.equal(r1.value.getDomainEvents().length, 0);
    assert.equal(r2.value.getDomainEvents().length, 1);
  });
});

// ── 08: Result Pattern ──────────────────────────────────────────

describe("08 — Result Pattern", () => {
  it("ok() e err() criam Results", () => {
    const s = ok(42);
    const f = err("erro");
    assert.equal(isSuccess(s), true);
    assert.equal(isFailure(f), true);
  });

  it("map transforma valor de sucesso", () => {
    const result = map(ok(10), (v) => v * 2);
    assertSuccess(result);
    assert.equal(result.value, 20);
  });

  it("map em failure não executa", () => {
    const result = map(err("fail"), (v: number) => v * 2);
    assertFailure(result);
  });

  it("flatMap encadeia operações", () => {
    const divide = (a: number, b: number): Result<number, string> => b === 0 ? err("div/0") : ok(a / b);
    const result = flatMap(ok(10), (v) => divide(v, 2));
    assertSuccess(result);
    assert.equal(result.value, 5);
  });

  it("fold reduz a valor", () => {
    const msg = fold(ok(42), (v) => `ok: ${v}`, (e) => `err: ${e}`);
    assert.equal(msg, "ok: 42");
  });

  it("match faz pattern matching", () => {
    const msg = match(err("falhou"), { success: (v) => `ok: ${v}`, failure: (e) => `err: ${e}` });
    assert.equal(msg, "err: falhou");
  });

  it("getOrElse retorna default em failure", () => {
    assert.equal(getOrElse(err("x"), 0), 0);
    assert.equal(getOrElse(ok(42), 0), 42);
  });

  it("getOrElse aceita lazy default", () => {
    assert.equal(getOrElse(err("x"), () => 99), 99);
  });

  it("orElse fornece fallback Result", () => {
    const result = orElse(err("fail"), ok(100));
    assertSuccess(result);
    assert.equal(result.value, 100);
  });

  it("all combina array de Results", () => {
    const result = all([ok(1), ok(2), ok(3)]);
    assertSuccess(result);
    assert.deepEqual(result.value, [1, 2, 3]);
  });

  it("all falha no primeiro erro", () => {
    const result = all([ok(1), err("fail"), ok(3)]);
    assertFailure(result);
    assert.equal(result.error, "fail");
  });

  it("OK_TRUE e OK_FALSE são singletons frozen", () => {
    assertSuccess(OK_TRUE);
    assert.equal(OK_TRUE.value, true);
    assertSuccess(OK_FALSE);
    assert.equal(OK_FALSE.value, false);
    assert.ok(Object.isFrozen(OK_TRUE));
    assert.ok(Object.isFrozen(OK_FALSE));
  });
});

// ── 09: Exceptions ──────────────────────────────────────────────

describe("09 — Exceptions", () => {
  it("ExceptionValidation tem status 400", () => {
    const e = ExceptionValidation.create("email", "Email inválido");
    assert.equal(e.status, 400);
    assert.equal(e.field, "email");
  });

  it("ExceptionBusiness factory methods", () => {
    assert.equal(ExceptionBusiness.duplicateEntry("email").status, 409);
    assert.equal(ExceptionBusiness.operationNotAllowed().status, 403);
    assert.equal(ExceptionBusiness.notFound("User").status, 404);
  });

  it("ExceptionOptimisticLock tem status 409", () => {
    const e = ExceptionOptimisticLock.create("Order", "123");
    assert.equal(e.status, 409);
  });

  it("todas herdam de Exceptions", () => {
    assert.ok(ExceptionValidation.create("f", "d") instanceof Exceptions);
    assert.ok(ExceptionBusiness.notFound() instanceof Exceptions);
    assert.ok(ExceptionOptimisticLock.create("X") instanceof Exceptions);
  });

  it("toJSON() retorna RFC 7807", () => {
    const json = ExceptionValidation.create("name", "obrigatório").toJSON();
    assert.ok(json.type);
    assert.ok(json.title);
    assert.ok(json.detail);
    assert.ok(json.status);
    assert.ok(json.code);
  });
});

// ── 10: UseCase ─────────────────────────────────────────────────

describe("10 — UseCase", () => {
  const dtoSchema = { name: { type: FString }, email: { type: FEmail }, age: { type: FInt } } satisfies ISchema;
  type TRegisterDtoProps = InferProps<typeof dtoSchema>;
  type TRegisterDtoJson = InferJson<typeof dtoSchema>;
  const dtoValidator = SchemaBuilder.compile(dtoSchema);

  interface TDtoFullProps extends TDtoReqProps { body: TRegisterDtoProps }
  interface TDtoFullJson extends TDtoReqPropsJson { body: TRegisterDtoJson }

  class DtoRegister extends DtoReq<TDtoFullProps, TDtoFullJson> {
    readonly body: TRegisterDtoProps;
    protected readonly _classInfo = { name: "DtoRegister", version: "1.0.0", description: "DTO" };
    private constructor(body: TRegisterDtoProps) { super(); this.body = body; }
    static create(data: TRegisterDtoJson): Result<DtoRegister, Exceptions> {
      const r = dtoValidator.create(data);
      if (isFailure(r)) return r;
      return ok(new DtoRegister(r.value));
    }
  }

  const aggSchema = { id: { type: FId, required: false }, name: { type: FString }, email: { type: FEmail }, age: { type: FInt }, status: { type: FString } } satisfies ISchema;
  type TAggProps = InferProps<typeof aggSchema>;
  type TAggJson = InferJson<typeof aggSchema>;

  class UserAgg extends Aggregate<TAggProps, TAggJson> implements TAggProps {
    readonly id: FId | undefined;
    readonly name: FString;
    readonly email: FEmail;
    readonly age: FInt;
    readonly status: FString;
    protected readonly _classInfo = { name: "User", version: "1.0.0", description: "Usuário" };
    private constructor(props: TAggProps) { super(); this.id = props.id; this.name = props.name; this.email = props.email; this.age = props.age; this.status = props.status; }
    static create(dto: DtoRegister): Result<UserAgg, Exceptions> {
      if (dto.body.age.getValue() < 18) return err(ExceptionBusiness.invalidBusinessRule("18+ anos"));
      return ok(new UserAgg({ id: FId.generate(), name: dto.body.name, email: dto.body.email, age: dto.body.age, status: FString.createOrThrow("active") }));
    }
  }

  class RegisterUseCase extends UseCase<DtoRegister, UserAgg> {
    protected readonly _classInfo = { name: "RegisterUser", version: "1.0.0", description: "Registra" };
    async execute(dto: DtoRegister): Promise<UserAgg> {
      const result = UserAgg.create(dto);
      if (isFailure(result)) throw result.error;
      return result.value;
    }
  }

  it("UseCase recebe Dto e retorna Aggregate", async () => {
    const dto = DtoRegister.create({ name: "Maria", email: "maria@test.com", age: 28 });
    assertSuccess(dto);
    const uc = new RegisterUseCase();
    const user = await uc.execute(dto.value);
    assert.equal(user.name.getValue(), "Maria");
    assert.ok(user.id);
  });

  it("UseCase propaga erro de negócio via throw", async () => {
    const dto = DtoRegister.create({ name: "Menor", email: "menor@test.com", age: 15 });
    assertSuccess(dto);
    const uc = new RegisterUseCase();
    await assert.rejects(() => uc.execute(dto.value), (e) => e instanceof Exceptions);
  });

  it("DTO rejeita input inválido antes do UseCase", () => {
    const dto = DtoRegister.create({ name: "", email: "invalid", age: 0 });
    assertFailure(dto);
  });
});

// ── 11: DTO ─────────────────────────────────────────────────────

describe("11 — DTO", () => {
  const schema = { street: { type: FString }, city: { type: FString }, number: { type: FInt, required: false } } satisfies ISchema;
  type TProps = InferProps<typeof schema>;
  type TJson = InferJson<typeof schema>;
  const validator = SchemaBuilder.compile(schema);

  interface TFullProps extends TDtoReqProps { body: TProps }
  interface TFullJson extends TDtoReqPropsJson { body: TJson }

  class DtoAddress extends DtoReq<TFullProps, TFullJson> {
    readonly body: TProps;
    protected readonly _classInfo = { name: "DtoAddress", version: "1.0.0", description: "DTO" };
    private constructor(body: TProps) { super(); this.body = body; }
    static create(data: TJson): Result<DtoAddress, Exceptions> {
      const r = validator.create(data);
      if (isFailure(r)) return r;
      return ok(new DtoAddress(r.value));
    }
  }

  it("DTO valida input válido", () => {
    const result = DtoAddress.create({ street: "Rua X", city: "SP", number: 123 });
    assertSuccess(result);
    assert.equal(result.value.body.street.getValue(), "Rua X");
  });

  it("DTO com campo optional ausente é aceito", () => {
    const result = DtoAddress.create({ street: "Rua Y", city: "RJ" });
    assertSuccess(result);
    assert.equal(result.value.body.number, undefined);
  });

  it("DTO rejeita input inválido", () => {
    const result = DtoAddress.create({ street: "", city: "SP" });
    assertFailure(result);
  });

  it("DTO.toJSON() serializa corretamente", () => {
    const result = DtoAddress.create({ street: "Rua Z", city: "BH" });
    assertSuccess(result);
    const json = result.value.toJSON();
    assert.ok(json.body);
  });
});

// ── 14: Repository + Paginação ──────────────────────────────────

describe("14 — Repository + Paginação", () => {
  // Reusa User do 12-aggregates via inline
  const userSchema = { id: { type: FId, required: false }, name: { type: FString }, email: { type: FEmail }, age: { type: FInt }, status: { type: FString } } satisfies ISchema;
  type TUProps = InferProps<typeof userSchema>;
  type TUJson = InferJson<typeof userSchema>;
  const uValidator = SchemaBuilder.compile(userSchema);

  class TestUser extends Aggregate<TUProps, TUJson> implements TUProps {
    readonly id: FId | undefined;
    readonly name: FString;
    readonly email: FEmail;
    readonly age: FInt;
    readonly status: FString;
    protected readonly _classInfo = { name: "User", version: "1.0.0", description: "User" };
    private constructor(props: TUProps) { super(); this.id = props.id; this.name = props.name; this.email = props.email; this.age = props.age; this.status = props.status; }
    static create(name: string, email: string): Result<TestUser, Exceptions> {
      return ok(new TestUser({ id: FId.generate(), name: FString.createOrThrow(name), email: FEmail.createOrThrow(email), age: FInt.createOrThrow(25), status: FString.createOrThrow("active") }));
    }
    static assign(data: TUJson): Result<TestUser, Exceptions> {
      const r = uValidator.assign(data);
      if (isFailure(r)) return r;
      return ok(new TestUser(r.value));
    }
  }

  class TestRepo implements IRepositoryBase<TestUser> {
    private readonly storage = new Map<string, TUJson>();
    async findById(id: FId): ResultPromise<TestUser | null, Exceptions> {
      const d = this.storage.get(id.getValue());
      if (!d) return ok(null);
      return TestUser.assign(d);
    }
    async findAll(params?: IPaginationParams): ResultPromise<Paginated<TestUser>, Exceptions> {
      const all = [...this.storage.values()];
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? all.length;
      const start = (page - 1) * pageSize;
      const items: TestUser[] = [];
      for (const d of all.slice(start, start + pageSize)) {
        const r = TestUser.assign(d);
        if (isFailure(r)) return r;
        items.push(r.value);
      }
      return ok(new Paginated(items, all.length, page, pageSize));
    }
    async create(entity: TestUser): ResultPromise<TestUser, Exceptions> {
      const json = entity.toJSON();
      if (!json.id) return err(ExceptionBusiness.invalidBusinessRule("sem id"));
      if (this.storage.has(json.id)) return err(ExceptionBusiness.duplicateEntry("id"));
      this.storage.set(json.id, json);
      return ok(entity);
    }
    async createMany(entities: TestUser[]): ResultPromise<TestUser[], Exceptions> {
      const created: TestUser[] = [];
      for (const entity of entities) {
        const result = await this.create(entity);
        if (isFailure(result)) return result;
        created.push(result.value);
      }
      return ok(created);
    }
    async update(entity: TestUser): ResultPromise<TestUser, Exceptions> {
      const json = entity.toJSON();
      if (!json.id || !this.storage.has(json.id)) return err(ExceptionBusiness.notFound("User"));
      this.storage.set(json.id, json);
      return ok(entity);
    }
    async updateMany(entities: TestUser[]): ResultPromise<TestUser[], Exceptions> {
      const updated: TestUser[] = [];
      for (const entity of entities) {
        const result = await this.update(entity);
        if (isFailure(result)) return result;
        updated.push(result.value);
      }
      return ok(updated);
    }
    async delete(id: FId): ResultPromise<void, Exceptions> {
      if (!this.storage.has(id.getValue())) return err(ExceptionBusiness.notFound("User"));
      this.storage.delete(id.getValue());
      return ok(undefined);
    }
    async deleteMany(ids: FId[]): ResultPromise<void, Exceptions> {
      for (const id of ids) {
        const result = await this.delete(id);
        if (isFailure(result)) return result;
      }
      return ok(undefined);
    }
    async count(): ResultPromise<number, Exceptions> {
      return ok(this.storage.size);
    }
    async exists(id: FId): ResultPromise<boolean, Exceptions> {
      return ok(this.storage.has(id.getValue()));
    }
    async existsMany(ids: FId[]): ResultPromise<Map<string, boolean>, Exceptions> {
      const result = new Map<string, boolean>();
      for (const id of ids) {
        result.set(id.getValue(), this.storage.has(id.getValue()));
      }
      return ok(result);
    }
  }

  it("create e findById", async () => {
    const repo = new TestRepo();
    const user = TestUser.create("Maria", "maria@test.com");
    assertSuccess(user);
    const saved = await repo.create(user.value);
    assertSuccess(saved);
    assert.ok(user.value.id);
    const found = await repo.findById(user.value.id);
    assertSuccess(found);
    assert.ok(found.value);
    assert.equal(found.value.name.getValue(), "Maria");
  });

  it("findAll sem paginação retorna todos", async () => {
    const repo = new TestRepo();
    for (let i = 0; i < 5; i++) {
      const u = TestUser.create(`User${i}`, `u${i}@test.com`);
      assertSuccess(u);
      await repo.create(u.value);
    }
    const all = await repo.findAll();
    assertSuccess(all);
    assert.equal(all.value.items.length, 5);
    assert.equal(all.value.total, 5);
  });

  it("findAll com paginação", async () => {
    const repo = new TestRepo();
    for (let i = 0; i < 5; i++) {
      const u = TestUser.create(`User${i}`, `u${i}@test.com`);
      assertSuccess(u);
      await repo.create(u.value);
    }
    const page1 = await repo.findAll({ page: 1, pageSize: 2 });
    assertSuccess(page1);
    assert.equal(page1.value.items.length, 2);
    assert.equal(page1.value.totalPages, 3);
    assert.equal(page1.value.page, 1);
  });

  it("create duplicado retorna erro", async () => {
    const repo = new TestRepo();
    const u = TestUser.create("Dup", "dup@test.com");
    assertSuccess(u);
    await repo.create(u.value);
    const dup = await repo.create(u.value);
    assertFailure(dup);
  });

  it("delete e not found", async () => {
    const repo = new TestRepo();
    const u = TestUser.create("Del", "del@test.com");
    assertSuccess(u);
    await repo.create(u.value);
    assert.ok(u.value.id);
    const del = await repo.delete(u.value.id);
    assertSuccess(del);
    const notFound = await repo.findById(u.value.id);
    assertSuccess(notFound);
    assert.equal(notFound.value, null);
  });
});

// ── 15: Mapper ──────────────────────────────────────────────────

describe("15 — Mapper + DtoRes", () => {
  const userSchema = { id: { type: FId, required: false }, name: { type: FString }, email: { type: FEmail }, age: { type: FInt }, status: { type: FString } } satisfies ISchema;
  type TMProps = InferProps<typeof userSchema>;
  type TMJson = InferJson<typeof userSchema>;
  const mValidator = SchemaBuilder.compile(userSchema);

  class MapperTestUser extends Aggregate<TMProps, TMJson> implements TMProps {
    readonly id: FId | undefined;
    readonly name: FString;
    readonly email: FEmail;
    readonly age: FInt;
    readonly status: FString;
    protected readonly _classInfo = { name: "User", version: "1.0.0", description: "User" };
    private constructor(props: TMProps) { super(); this.id = props.id; this.name = props.name; this.email = props.email; this.age = props.age; this.status = props.status; }
    static assign(data: TMJson): Result<MapperTestUser, Exceptions> {
      const r = mValidator.assign(data);
      if (isFailure(r)) return r;
      return ok(new MapperTestUser(r.value));
    }
  }

  const responseSchema = { id: { type: FString }, fullName: { type: FString }, isAdult: { type: FBoolean } } satisfies ISchema;
  type TRespProps = InferProps<typeof responseSchema>;
  type TRespJson = InferJson<typeof responseSchema>;
  const respValidator = SchemaBuilder.compile(responseSchema);

  interface TRespFullProps extends TDtoResProps { body: TRespProps }
  interface TRespFullJson extends TDtoResPropsJson { body: TRespJson }

  class DtoTestResponse extends DtoRes<TRespFullProps, TRespFullJson> {
    readonly body: TRespProps;
    protected readonly _classInfo = { name: "DtoResp", version: "1.0.0", description: "Response" };
    private constructor(body: TRespProps) { super(); this.body = body; }
    static create(data: TRespJson): Result<DtoTestResponse, Exceptions> {
      const r = respValidator.create(data);
      if (isFailure(r)) return r;
      return ok(new DtoTestResponse(r.value));
    }
  }

  it("toDomain converte JSON para Aggregate", () => {
    const raw: TMJson = { id: "019d0863-5d45-7246-b6d0-de5098bfd12e", name: "Maria", email: "maria@test.com", age: 28, status: "active" };
    const user = MapperTestUser.assign(raw);
    assertSuccess(user);
    assert.equal(user.value.name.getValue(), "Maria");
  });

  it("toPersistence converte Aggregate para JSON", () => {
    const user = MapperTestUser.assign({ id: "019d0863-5d45-7246-b6d0-de5098bfd12e", name: "Maria", email: "maria@test.com", age: 28, status: "active" });
    assertSuccess(user);
    const json = user.value.toJSON();
    assert.equal(json.name, "Maria");
    assert.equal(typeof json.id, "string");
  });

  it("DtoRes serializa corretamente", () => {
    const resp = DtoTestResponse.create({ id: "abc", fullName: "Maria Silva", isAdult: true });
    assertSuccess(resp);
    const json = resp.value.toJSON();
    assert.ok(json.body);
    assert.equal(json.body.fullName, "Maria Silva");
  });
});
