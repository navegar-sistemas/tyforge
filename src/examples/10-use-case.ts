import { UseCase, isSuccess, isFailure, Exceptions } from "@tyforge/index";
import { DtoCreateUser } from "./11-dto";
import { User } from "./12-aggregates";

console.log("=== UseCase (orquestração) ===\n");

// ═══════════════════════════════════════════════════════════════════
// USE CASE — recebe DTO já validado, retorna domain model
// ═══════════════════════════════════════════════════════════════════

class RegisterUser extends UseCase<DtoCreateUser, User> {
  protected readonly _classInfo = { name: "RegisterUser", version: "1.0.0", description: "Registra um novo usuário" };

  async execute(dto: DtoCreateUser): Promise<User> {
    // 1. Aggregate recebe TypeFields do DTO → aplica regras de negócio
    const userResult = User.create({
      name: dto.body.name,
      email: dto.body.email,
      age: dto.body.age,
    });
    if (isFailure(userResult)) throw userResult.error;

    const user = userResult.value;

    // 2. Persistir e despachar eventos
    console.log("  [repo] Salvando:", user.toJSON().id);
    for (const event of user.getDomainEvents()) {
      console.log("  [event]", event.eventName, event.payload);
    }
    user.clearDomainEvents();

    return user;
  }
}

// ═══════════════════════════════════════════════════════════════════
// EXECUTAR (simula controller)
// ═══════════════════════════════════════════════════════════════════

async function main() {
  const useCase = new RegisterUser();

  // Sucesso — controller cria DTO, UseCase recebe já validado
  const dtoResult = DtoCreateUser.create({ name: "Maria Silva", email: "maria@test.com", age: 28 });
  if (isSuccess(dtoResult)) {
    try {
      const user = await useCase.execute(dtoResult.value);
      console.log("\nResultado:", user.toJSON());
    } catch (error) {
      if (error instanceof Exceptions) console.log("Erro:", error.detail);
    }
  }

  // Erro no DTO — controller trata antes de chamar UseCase
  const badDto = DtoCreateUser.create({ name: "Bad", email: "invalid", age: 25 });
  if (isFailure(badDto)) {
    console.log("\nErro na validação (controller):", badDto.error.detail);
  }

  // Erro no Aggregate — regra de negócio (UseCase propaga)
  const minorDto = DtoCreateUser.create({ name: "Menor", email: "menor@test.com", age: 15 });
  if (isSuccess(minorDto)) {
    try {
      await useCase.execute(minorDto.value);
    } catch (error) {
      if (error instanceof Exceptions) console.log("Erro de negócio:", error.detail);
    }
  }
}

main().then(() => console.log("\n✅ Exemplo 10 concluído"));
