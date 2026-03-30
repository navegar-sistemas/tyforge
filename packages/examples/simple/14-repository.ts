import {
  FId, FString, FEmail, FInt, FBoolean, FPageNumber, FPageSize, Paginated,
  isSuccess, isFailure, ok, err,
  Exceptions, ExceptionBusiness,
} from "tyforge";
import { RepositoryCrud } from "tyforge";
import type { ResultPromise, IPaginationParams } from "tyforge";
import { User } from "./12-aggregates";
import type { TUserJson } from "./12-aggregates";

console.log("=== Repository + Pagination ===\n");

class RepositoryUser extends RepositoryCrud<User> {
  private readonly storage = new Map<string, TUserJson>();

  async findById(id: FId): ResultPromise<User | null, Exceptions> {
    const data = this.storage.get(id.getValue());
    if (!data) return ok(null);
    return User.assign(data);
  }

  async findAll(params?: IPaginationParams): ResultPromise<Paginated<User>, Exceptions> {
    const allData = [...this.storage.values()];
    const total = allData.length;

    const page = params?.page.getValue() ?? 1;
    const pageSize = params?.pageSize.getValue() ?? total;
    const start = (page - 1) * pageSize;
    const pageData = allData.slice(start, start + pageSize);

    const users: User[] = [];
    for (const data of pageData) {
      const result = User.assign(data);
      if (isFailure(result)) return result;
      users.push(result.value);
    }

    const paginated = Paginated.create<unknown, User>({
      items: users,
      totalItems: total,
      page: params?.page.getValue() ?? 1,
      pageSize: params?.pageSize.getValue() ?? total,
    });
    return paginated;
  }

  async create(entity: User): ResultPromise<User, Exceptions> {
    const json = entity.toJSON();
    if (!json.id) return err(ExceptionBusiness.invalidBusinessRule("entidade sem id"));
    if (this.storage.has(json.id)) return err(ExceptionBusiness.duplicateEntry("id"));
    this.storage.set(json.id, json);
    return ok(entity);
  }

  async update(entity: User): ResultPromise<User, Exceptions> {
    const json = entity.toJSON();
    if (!json.id || !this.storage.has(json.id)) return err(ExceptionBusiness.notFound("User"));
    this.storage.set(json.id, json);
    return ok(entity);
  }

  async updateMany(entities: User[]): ResultPromise<User[], Exceptions> {
    const updated: User[] = [];
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

  async count(): ResultPromise<FInt, Exceptions> {
    return ok(FInt.createOrThrow(this.storage.size));
  }

  async createMany(entities: User[]): ResultPromise<User[], Exceptions> {
    const saved: User[] = [];
    for (const entity of entities) {
      const result = await this.create(entity);
      if (isFailure(result)) return result;
      saved.push(result.value);
    }
    return ok(saved);
  }

  async deleteMany(ids: FId[]): ResultPromise<void, Exceptions> {
    for (const id of ids) {
      const result = await this.delete(id);
      if (isFailure(result)) return result;
    }
    return ok(undefined);
  }

  async exists(id: FId): ResultPromise<FBoolean, Exceptions> {
    return ok(FBoolean.createOrThrow(this.storage.has(id.getValue())));
  }

  async existsMany(ids: FId[]): ResultPromise<Map<string, FBoolean>, Exceptions> {
    const result = new Map<string, FBoolean>();
    for (const id of ids) {
      result.set(id.getValue(), FBoolean.createOrThrow(this.storage.has(id.getValue())));
    }
    return ok(result);
  }
}

async function main() {
  const repo = new RepositoryUser();

  const names = ["Maria", "João", "Ana", "Pedro", "Carla"];
  for (const name of names) {
    const userResult = User.create({
      name: FString.createOrThrow(name),
      email: FEmail.createOrThrow(`${name.toLowerCase()}@test.com`),
      age: FInt.createOrThrow(20 + names.indexOf(name)),
    });
    if (isSuccess(userResult)) {
      userResult.value.clearDomainEvents();
      await repo.create(userResult.value);
    }
  }
  console.log("5 users created\n");

  const all = await repo.findAll();
  if (isSuccess(all)) {
    console.log("findAll():", all.value.items.length, "itens, total:", all.value.totalItems.getValue());
  }

  const page1 = await repo.findAll({ page: FPageNumber.createOrThrow(1), pageSize: FPageSize.createOrThrow(2) });
  if (isSuccess(page1)) {
    console.log("\nPágina 1:");
    console.log("  items:", page1.value.items.map(u => u.name.getValue()));
    console.log("  total:", page1.value.totalItems.getValue());
    console.log("  page:", page1.value.page.getValue());
    console.log("  pageSize:", page1.value.pageSize.getValue());
    console.log("  totalPages:", page1.value.totalPages);
  }

  const page3 = await repo.findAll({ page: FPageNumber.createOrThrow(3), pageSize: FPageSize.createOrThrow(2) });
  if (isSuccess(page3)) {
    console.log("\nPágina 3:");
    console.log("  items:", page3.value.items.map(u => u.name.getValue()));
    console.log("  totalPages:", page3.value.totalPages);
  }

  if (isSuccess(all) && all.value.items.length > 0) {
    const firstId = all.value.items[0].id;
    if (firstId) {
      const found = await repo.findById(firstId);
      if (isSuccess(found) && found.value) {
        console.log("\nBuscado:", found.value.toJSON());
      }
    }
  }

  if (isSuccess(all) && all.value.items.length > 0) {
    const updated = await repo.update(all.value.items[0]);
    if (isSuccess(updated)) console.log("Atualizado:", updated.value.name.getValue());
  }

  if (isSuccess(all) && all.value.items.length > 0) {
    const lastId = all.value.items[all.value.items.length - 1].id;
    if (lastId) {
      const deleted = await repo.delete(lastId);
      if (isSuccess(deleted)) console.log("Deletado com sucesso");

      const afterDelete = await repo.findAll();
      if (isSuccess(afterDelete)) console.log("Após delete:", afterDelete.value.totalItems.getValue(), "itens");
    }
  }

  if (isSuccess(all) && all.value.items.length > 0) {
    const duplicateResult = await repo.create(all.value.items[0]);
    if (isFailure(duplicateResult)) console.log("\nErro duplicata:", duplicateResult.error.detail);
  }

  const fakeId = FId.generate();
  const notFoundResult = await repo.delete(fakeId);
  if (isFailure(notFoundResult)) console.log("Erro not found:", notFoundResult.error.detail);
}

main().then(() => console.log("\n✅ Exemplo 14 concluído"));
