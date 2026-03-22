import {
  Aggregate, SchemaBuilder,
  FString, FEmail, FId, FInt,
  isFailure, ok, err, Result, Exceptions, ExceptionBusiness,
} from "@tyforge/index";
import type { ISchema, InferProps, InferJson } from "@tyforge/index";
import { EventUserRegistered } from "./13-events";

// ═══════════════════════════════════════════════════════════════════
// Aggregates reutilizáveis — importados por outros exemplos
// ═══════════════════════════════════════════════════════════════════

// ─── User Aggregate ───

const userSchema = {
  id: { type: FId, required: false },
  name: { type: FString },
  email: { type: FEmail },
  age: { type: FInt },
  status: { type: FString },
} satisfies ISchema;

export type TUserProps = InferProps<typeof userSchema>;
export type TUserJson = InferJson<typeof userSchema>;

const userValidator = SchemaBuilder.compile(userSchema);

export type TCreateUserInput = {
  name: FString;
  email: FEmail;
  age: FInt;
};

// ─── Aggregate ───

export class User extends Aggregate<TUserProps, TUserJson> implements TUserProps {
  readonly id: FId | undefined;
  readonly name: FString;
  readonly email: FEmail;
  readonly age: FInt;
  readonly status: FString;

  protected readonly _classInfo = { name: "User", version: "1.0.0", description: "Usuário" };

  private constructor(props: TUserProps) {
    super();
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.age = props.age;
    this.status = props.status;
  }

  static create(data: TCreateUserInput): Result<User, Exceptions> {
    // Regra de negócio: usuário deve ter 18+ anos
    if (data.age.getValue() < 18) {
      return err(ExceptionBusiness.invalidBusinessRule("Usuário deve ter 18+ anos"));
    }

    const id = FId.generate();
    const user = new User({
      id,
      name: data.name,
      email: data.email,
      age: data.age,
      status: FString.createOrThrow("active"),
    });

    user.addDomainEvent(EventUserRegistered.create({
      userId: id.getValue(),
      email: data.email.getValue(),
    }));

    return ok(user);
  }

  static assign(data: TUserJson): Result<User, Exceptions> {
    const result = userValidator.assign(data);
    if (isFailure(result)) return result;
    return ok(new User(result.value));
  }
}
