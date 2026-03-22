import {
  isFailure, ok,
  DtoResponse, SchemaBuilder, FString, FEmail, FBoolean,
  Result, Exceptions,
} from "@tyforge/index";
import type { IMapper, ISchema, InferProps, InferJson, TDtoResponsePropsBase, TDtoResponsePropsJson } from "@tyforge/index";
import { User } from "./12-aggregates";
import type { TUserJson } from "./12-aggregates";
import { DtoCreateUser } from "./11-dto";
import type { TDtoCreateUserJson } from "./11-dto";

console.log("=== Mapper + DtoResponse ===\n");

// ═══════════════════════════════════════════════════════════════════
// DtoResponse — DTO de saída (response da API)
// ═══════════════════════════════════════════════════════════════════

const userResponseSchema = {
  id: { type: FString },
  fullName: { type: FString },
  email: { type: FEmail },
  isAdult: { type: FBoolean },
} satisfies ISchema;

type TDtoUserResponseProps = InferProps<typeof userResponseSchema>;
type TDtoUserResponseJson = InferJson<typeof userResponseSchema>;

const userResponseValidator = SchemaBuilder.compile(userResponseSchema);

interface TDtoUserResponseFullProps extends TDtoResponsePropsBase { body: TDtoUserResponseProps }
interface TDtoUserResponseFullJson extends TDtoResponsePropsJson { body: TDtoUserResponseJson }

export class DtoUserResponse extends DtoResponse<TDtoUserResponseFullProps, TDtoUserResponseFullJson> {
  readonly body: TDtoUserResponseProps;

  protected readonly _classInfo = { name: "DtoUserResponse", version: "1.0.0", description: "DTO de resposta de usuário" };

  private constructor(body: TDtoUserResponseProps) {
    super();
    this.body = body;
  }

  static create(data: TDtoUserResponseJson): Result<DtoUserResponse, Exceptions> {
    const result = userResponseValidator.create(data);
    if (isFailure(result)) return result;
    return ok(new DtoUserResponse(result.value));
  }
}

// ═══════════════════════════════════════════════════════════════════
// IMapper — Domain ↔ Persistência ↔ Request ↔ Response
// ═══════════════════════════════════════════════════════════════════

class MapperUser implements IMapper<User, TUserJson, DtoCreateUser, DtoUserResponse, TDtoCreateUserJson, User> {
  toDomain(raw: TUserJson): User {
    const result = User.assign(raw);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  toPersistence(domain: User): TUserJson {
    return domain.toJSON();
  }

  toRequest(raw: TDtoCreateUserJson): DtoCreateUser {
    const result = DtoCreateUser.create(raw);
    if (isFailure(result)) throw result.error;
    return result.value;
  }

  toResponse(input: User): DtoUserResponse {
    const result = DtoUserResponse.create({
      id: input.id?.getValue() ?? "",
      fullName: input.name.getValue(),
      email: input.email.getValue(),
      isAdult: input.age.getValue() >= 18,
    });
    if (isFailure(result)) throw result.error;
    return result.value;
  }
}

// ═══════════════════════════════════════════════════════════════════
// USO
// ═══════════════════════════════════════════════════════════════════

const mapper = new MapperUser();

// 1. Request → Dto (valida input)
const dto = mapper.toRequest({ name: "Maria Silva", email: "maria@test.com", age: 28 });
console.log("Request → Dto:", dto.toJSON());

// 2. JSON do banco → Domain
const dbRow: TUserJson = {
  id: "019d0863-5d45-7246-b6d0-de5098bfd12e",
  name: "Maria Silva",
  email: "maria@test.com",
  age: 28,
  status: "active",
};

const user = mapper.toDomain(dbRow);
console.log("Persistência → Domain:", user.toJSON());

// 3. Domain → DtoResponse (response)
const response = mapper.toResponse(user);
console.log("Domain → DtoResponse:", response.toJSON());

// 4. Domain → Persistência
const persistence = mapper.toPersistence(user);
console.log("Domain → Persistência:", persistence);

console.log("\n✅ Exemplo 15 concluído");
