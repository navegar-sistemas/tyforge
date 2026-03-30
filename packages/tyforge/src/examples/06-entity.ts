import {
  Entity, SchemaBuilder, FString, FEmail, FId,
  isSuccess, isFailure, ok, err, Result, Exceptions, ExceptionBusiness,
} from "@tyforge/index";
import type { ISchema, InferProps, InferJson } from "@tyforge/index";
import { DtoCreateUser } from "./11-dto";

console.log("=== Entity ===\n");

// ─── Schema ───
const userSchema = {
  id: { type: FId, required: false },
  name: { type: FString },
  email: { type: FEmail },
  role: { type: FString },
} satisfies ISchema;

type TUserProps = InferProps<typeof userSchema>;
type TUserJson = InferJson<typeof userSchema>;

const userValidator = SchemaBuilder.compile(userSchema);

// ─── Input do create ───
type TCreateUserInput = {
  name: FString;
  email: FEmail;
};

// ─── Entity ───
class User extends Entity<TUserProps, TUserJson> implements TUserProps {
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

  static create(data: TCreateUserInput): Result<User, Exceptions> {
    // Regra de negócio: emails corporativos não podem se registrar
    const domain = data.email.getValue().split("@")[1];
    if (domain === "admin.internal") {
      return err(ExceptionBusiness.invalidBusinessRule("emails @admin.internal não podem se registrar"));
    }

    return ok(new User({
      id: FId.generate(),
      name: data.name,
      email: data.email,
      role: FString.createOrThrow("user"),
    }));
  }

  static assign(data: TUserJson): Result<User, Exceptions> {
    const result = userValidator.assign(data);
    if (isFailure(result)) return result;
    return ok(new User(result.value));
  }
}

// ─── Uso ───

// 1. DTO valida primitivos da request
const dto = DtoCreateUser.create({ name: "Maria", email: "maria@test.com", age: 28 });

if (isSuccess(dto)) {
  // 2. Entity recebe TypeFields do DTO
  const user = User.create({
    name: dto.value.body.name,
    email: dto.value.body.email,
  });

  if (isSuccess(user)) {
    const json = user.value.toJSON();
    console.log("User criado:");
    console.log("  id:", json.id);
    console.log("  role:", json.role);
    console.log("  name:", json.name);
  }
}

// assign() — banco
const fromDb = User.assign({
  id: "019d0863-5d45-7246-b6d0-de5098bfd12e",
  name: "João",
  email: "joao@test.com",
  role: "admin",
});
if (isSuccess(fromDb)) console.log("\nUser do banco:", fromDb.value.toJSON());

// equals()
const u1Dto = DtoCreateUser.create({ name: "A", email: "a@a.com", age: 20 });
const u2Dto = DtoCreateUser.create({ name: "B", email: "b@b.com", age: 25 });
if (isSuccess(u1Dto) && isSuccess(u2Dto)) {
  const u1 = User.create({ name: u1Dto.value.body.name, email: u1Dto.value.body.email });
  const u2 = User.create({ name: u2Dto.value.body.name, email: u2Dto.value.body.email });
  if (isSuccess(u1) && isSuccess(u2))
    console.log("\nequals (ids diferentes):", u1.value.equals(u2.value));
}

// Erro de regra de negócio — email corporativo bloqueado
const blockedDto = DtoCreateUser.create({ name: "Admin", email: "admin@admin.internal", age: 30 });
if (isSuccess(blockedDto)) {
  const blocked = User.create({
    name: blockedDto.value.body.name,
    email: blockedDto.value.body.email,
  });
  if (isFailure(blocked)) console.log("\nErro de negócio:", blocked.error.detail);
}

// Erro no DTO — validação de formato
const bad = DtoCreateUser.create({ name: "", email: "invalid", age: 0 });
if (isFailure(bad)) console.log("Erro no DTO:", bad.error.detail);

console.log("\n✅ Exemplo 06 concluído");
