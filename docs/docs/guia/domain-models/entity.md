---
title: Entity
sidebar_position: 2
---

# Entity

Uma **Entity** e um objeto de dominio que possui identidade propria. Duas entidades sao consideradas iguais quando possuem o mesmo construtor e o mesmo valor de `id`, independentemente dos demais atributos.

## Assinatura

```typescript
abstract class Entity<
  TProps extends IEntityPropsBase,
  TPropsJson = unknown,
> extends ClassDomainModels<TProps, TPropsJson> {
  declare id?: FId;

  protected constructor();

  public equals(other: this): boolean;
}
```

## Interface `IEntityPropsBase`

Toda Entity exige que suas props estendam `IEntityPropsBase`:

```typescript
export interface IEntityPropsBase {
  id?: FId;
}
```

O `id` e opcional — permite criar entidades que ainda nao foram persistidas (sem ID atribuido). Apos a persistencia, o ID e definido e a entidade passa a ser identificavel.

## Comparacao por identidade

O metodo `equals()` compara entidades pelo valor do ID:

```typescript
public equals(other: this): boolean {
  if (!other) return false;
  if (other.constructor !== this.constructor) return false;
  if (!this.id || !other.id) return false;
  return this.id.getValue() === other.id.getValue();
}
```

**Regras:**
- Retorna `false` se `other` for nulo/undefined
- Retorna `false` se os construtores forem diferentes (classes diferentes)
- Retorna `false` se qualquer um dos IDs for undefined
- Retorna `true` somente se ambos os IDs tiverem o mesmo valor

## Exemplo

```typescript
import { Entity, IEntityPropsBase, FId, FString, FEmail } from "tyforge";

// 1. Defina os tipos
interface IUsuarioProps extends IEntityPropsBase {
  id?: FId;
  nome: FString;
  email: FEmail;
}

interface IUsuarioJson {
  id?: string;
  nome: string;
  email: string;
}

// 2. Implemente a Entity
class Usuario extends Entity<IUsuarioProps, IUsuarioJson> {
  protected readonly _classInfo = {
    name: "Usuario",
    version: "1.0.0",
    description: "Entidade de usuario do sistema",
  };

  override id?: FId;
  nome: FString;
  email: FEmail;

  private constructor(props: IUsuarioProps) {
    super();
    this.id = props.id;
    this.nome = props.nome;
    this.email = props.email;
  }

  static create(props: IUsuarioProps): Usuario {
    return new Usuario(props);
  }
}

// 3. Use a Entity
const usuario = Usuario.create({
  id: FId.generate(),
  nome: FString.createOrThrow("Maria Silva"),
  email: FEmail.createOrThrow("maria@email.com"),
});

// Serializar para JSON
const json = usuario.toJson();
// { id: "uuid-aqui", nome: "Maria Silva", email: "maria@email.com" }

// Comparar por identidade
const mesmoUsuario = Usuario.create({
  id: usuario.id,
  nome: FString.createOrThrow("Maria S."), // nome diferente
  email: FEmail.createOrThrow("maria@outro.com"), // email diferente
});

usuario.equals(mesmoUsuario); // true — mesmo ID
```

## Heranca

`Entity` e a classe base para `Aggregate`, que adiciona suporte a domain events. Veja [Aggregate](/guia/domain-models/aggregate) para mais detalhes.
