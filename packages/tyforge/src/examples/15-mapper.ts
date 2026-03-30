import {
  isFailure, isSuccess, ok, all,
  DtoRes, SchemaBuilder, FString, FEmail, FBoolean,
  Result, Exceptions, Paginated,
} from "@tyforge/index";
import type { IMapper, ISchema, InferProps, InferJson, TDtoResProps, TDtoResPropsJson } from "@tyforge/index";
import { User } from "./12-aggregates";
import type { TUserJson } from "./12-aggregates";

console.log("=== Mapper ===\n");

// ═══════════════════════════════════════════════════════════════════
// IMapper — Domain <-> Persistence (single responsibility)
// ═══════════════════════════════════════════════════════════════════

class MapperUser implements IMapper<User, TUserJson> {
  toDomain(raw: TUserJson): Result<User, Exceptions> {
    return User.assign(raw);
  }

  toDomainMany(raw: TUserJson[]): Result<User[], Exceptions> {
    return all(raw.map(r => this.toDomain(r)));
  }

  toPersistence(domain: User): Result<TUserJson, Exceptions> {
    return ok(domain.toJSON());
  }

  toPersistenceMany(domains: User[]): Result<TUserJson[], Exceptions> {
    return all(domains.map(d => this.toPersistence(d)));
  }

  toDomainPaginated(raw: Paginated<TUserJson>): Result<Paginated<User>, Exceptions> {
    const result = this.toDomainMany(raw.items);
    if (isFailure(result)) return result;
    return Paginated.create<unknown, User>({ items: result.value, totalItems: raw.totalItems.getValue(), page: raw.page.getValue(), pageSize: raw.pageSize.getValue() });
  }
}

// ═══════════════════════════════════════════════════════════════════
// DtoRes — assembled by controller/use case, not by the mapper
// ═══════════════════════════════════════════════════════════════════

const userProfileSchema = {
  id: { type: FString },
  fullName: { type: FString },
  email: { type: FEmail },
  isAdult: { type: FBoolean },
} satisfies ISchema;

type TDtoResUserProfileProps = InferProps<typeof userProfileSchema>;
type TDtoResUserProfileJson = InferJson<typeof userProfileSchema>;

const userProfileValidator = SchemaBuilder.compile(userProfileSchema);

interface TDtoResUserProfileFullProps extends TDtoResProps { body: TDtoResUserProfileProps }
interface TDtoResUserProfileFullJson extends TDtoResPropsJson { body: TDtoResUserProfileJson }

export class DtoResUserProfile extends DtoRes<TDtoResUserProfileFullProps, TDtoResUserProfileFullJson> {
  readonly body: TDtoResUserProfileProps;

  protected readonly _classInfo = { name: "DtoResUserProfile", version: "1.0.0", description: "Response de perfil de usuário" };

  private constructor(body: TDtoResUserProfileProps) {
    super();
    this.body = body;
  }

  static create<T = TDtoResUserProfileFullJson>(raw: T, fieldPath = "DtoResUserProfile"): Result<DtoResUserProfile, Exceptions> {
    const result = userProfileValidator.create(raw, fieldPath);
    if (isFailure(result)) return result;
    return ok(new DtoResUserProfile(result.value));
  }

  static fromDomain(domain: User): Result<DtoResUserProfile, Exceptions> {
    return DtoResUserProfile.create({
      id: domain.id?.getValue() ?? "",
      fullName: domain.name.getValue(),
      email: domain.email.getValue(),
      isAdult: domain.age.getValue() >= 18,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// USAGE
// ═══════════════════════════════════════════════════════════════════

const mapper = new MapperUser();

// 1. Persistence -> Domain
const dbRow: TUserJson = {
  id: "019d0863-5d45-7246-b6d0-de5098bfd12e",
  name: "Maria Silva",
  email: "maria@test.com",
  age: 28,
  status: "active",
};

const userResult = mapper.toDomain(dbRow);
if (isFailure(userResult)) throw userResult.error;
const user = userResult.value;
console.log("Persistence -> Domain:", user.toJSON());

// 2. Domain -> Persistence
const persistenceResult = mapper.toPersistence(user);
if (isSuccess(persistenceResult)) console.log("Domain -> Persistence:", persistenceResult.value);

// 3. Domain -> DtoRes (controller assembles, not the mapper)
const profileResult = DtoResUserProfile.fromDomain(user);
if (isSuccess(profileResult)) console.log("Domain → DtoRes:", profileResult.value.toJSON());

// 4. Batch — multiple records from database
const dbRows: TUserJson[] = [
  { id: "019d0863-5d45-7246-b6d0-de5098bfd12e", name: "Maria", email: "maria@test.com", age: 28, status: "active" },
  { id: "019d0863-5d45-7246-b6d0-de5098bfd13f", name: "João", email: "joao@test.com", age: 30, status: "active" },
];
const usersResult = mapper.toDomainMany(dbRows);
if (isSuccess(usersResult)) console.log("Batch:", usersResult.value.length, "usuários");

console.log("\n✅ Exemplo 15 concluído");
