---
title: UseCase
sidebar_position: 1
---

# UseCase

O `UseCase` e a classe abstrata base para casos de uso da camada de aplicacao. Ele orquestra a logica de negocio, recebendo um DTO validado como entrada e retornando um domain model como saida.

## Definicao

```typescript
import { Class } from "tyforge";

abstract class UseCase<TInput, TOutput> extends Class {
  abstract execute(input: TInput): Promise<TOutput>;
}
```

O `UseCase` estende `Class`, herdando a obrigatoriedade de definir `_classInfo` com `name`, `version` e `description`.

## Decisao de design

O metodo `execute()` retorna `Promise<TOutput>` e propaga erros via `throw` na fronteira da aplicacao. Isso e intencional:

- **Domain models** usam `Result<T, E>` para error handling funcional nos hot paths internos
- **Use cases** convertem falhas em exceptions para consumo direto por controllers e middlewares de erro do framework HTTP

Essa separacao mantem o dominio puro (sem dependencia de framework) e simplifica o tratamento de erros na camada de apresentacao.

## Regras de uso

| Regra | Descricao |
|-------|-----------|
| Input e sempre um `Dto` ou `DtoReq` | Nunca use primitivos como entrada |
| Output e sempre um domain model | Nunca retorne primitivos — retorne `Aggregate`, `Entity`, `ValueObject` ou `DtoRes` |
| DTO ja deve estar validado | O controller valida e cria o DTO antes de chamar o UseCase |
| Erros de negocio sao propagados via throw | O UseCase converte `Result.error` em `throw` |

## Exemplo completo

```typescript
import { UseCase, isSuccess, isFailure, Exceptions } from "tyforge";

// DTO validado pelo controller
import { DtoCreateUser } from "./dto-create-user";
// Aggregate com regras de negocio
import { User } from "./user.aggregate";

class RegisterUser extends UseCase<DtoCreateUser, User> {
  protected readonly _classInfo = {
    name: "RegisterUser",
    version: "1.0.0",
    description: "Registra um novo usuario",
  };

  async execute(dto: DtoCreateUser): Promise<User> {
    // 1. Aggregate recebe TypeFields do DTO e aplica regras de negocio
    const userResult = User.create({
      name: dto.body.name,
      email: dto.body.email,
      age: dto.body.age,
    });
    if (isFailure(userResult)) throw userResult.error;

    const user = userResult.value;

    // 2. Persistir e despachar eventos
    // await this.repository.create(user);
    for (const event of user.getDomainEvents()) {
      // await this.eventBus.publish(event);
    }
    user.clearDomainEvents();

    return user;
  }
}
```

## Fluxo tipico

O fluxo completo desde o controller ate a persistencia segue esta sequencia:

1. **Controller** recebe dados brutos do request
2. **Controller** cria o `Dto` com `DtoCreateUser.create(rawData)` — se falhar, retorna erro ao cliente
3. **Controller** instancia o UseCase e chama `execute(dto)`
4. **UseCase** cria o Aggregate com `User.create(...)` — se falhar, propaga via throw
5. **UseCase** persiste no repositorio e despacha eventos
6. **UseCase** retorna o domain model ao controller
7. **Controller** converte o domain model em resposta HTTP (opcionalmente via `DtoRes`)

```typescript
// No controller (exemplo simplificado)
async function handleRegister(req: Request, res: Response) {
  const dtoResult = DtoCreateUser.create(req.body);
  if (isFailure(dtoResult)) {
    return res.status(400).json(dtoResult.error);
  }

  try {
    const useCase = new RegisterUser();
    const user = await useCase.execute(dtoResult.value);
    return res.status(201).json(user.toJSON());
  } catch (error) {
    if (error instanceof Exceptions) {
      return res.status(error.status).json(error);
    }
    throw error;
  }
}
```

## Proximos passos

- [Mapper](/guia/application/mapper) — conversao entre Domain e Persistence
- [Repository](/guia/infrastructure/repository) — interface de persistencia
- [Dto](/guia/domain-models/dto) — Data Transfer Objects com TypeFields
