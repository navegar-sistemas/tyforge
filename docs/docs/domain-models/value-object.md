---
title: Value Object
sidebar_position: 3
slug: /domain-models/value-object
---

# Value Object

Um **Value Object** e um objeto de dominio sem identidade propria. Dois Value Objects sao considerados iguais quando seus atributos sao estruturalmente identicos.

## Assinatura

```typescript
abstract class ValueObject<TProps, TPropsJson> extends ClassDomainModels<
  TProps,
  TPropsJson
> {
  equals(input: ClassDomainModels<TProps, TPropsJson>): boolean;
}
```

## Comparacao estrutural

O metodo `equals()` compara Value Objects serializando ambos para JSON e comparando as strings resultantes:

```typescript
equals(input: ClassDomainModels<TProps, TPropsJson>): boolean {
  if (!input || input.constructor !== this.constructor) return false;
  return JSON.stringify(this.toJson()) === JSON.stringify(input.toJson());
}
```

**Regras:**
- Retorna `false` se `input` for nulo/undefined
- Retorna `false` se os construtores forem diferentes
- Compara a representacao JSON completa dos dois objetos
- Todos os TypeFields sao desembrulhados para primitivos antes da comparacao

## Quando usar Value Object vs Entity

| Criterio | Value Object | Entity |
|----------|-------------|--------|
| **Identidade** | Nao possui — definido pelos atributos | Possui — definido pelo ID |
| **Igualdade** | Por estrutura (todos os campos) | Por identidade (ID) |
| **Ciclo de vida** | Substituivel — trocar por outro com mesmos valores | Rastreavel — persiste com mesmo ID |
| **Exemplos** | Endereco, Dinheiro, Periodo, Coordenada | Usuario, Pedido, Conta, Produto |

**Regra pratica:** se dois objetos com os mesmos valores sao intercambiaveis no dominio, use Value Object. Se precisam ser rastreados individualmente ao longo do tempo, use Entity.

## Exemplo

```typescript
import { ValueObject, FString, FInt } from "@navegar-sistemas/tyforge";

// 1. Defina os tipos
interface IEnderecoProps {
  rua: FString;
  numero: FInt;
  cidade: FString;
}

interface IEnderecoJson {
  rua: string;
  numero: number;
  cidade: string;
}

// 2. Implemente o Value Object
class Endereco extends ValueObject<IEnderecoProps, IEnderecoJson> {
  protected readonly _classInfo = {
    name: "Endereco",
    version: "1.0.0",
    description: "Endereco completo",
  };

  rua: FString;
  numero: FInt;
  cidade: FString;

  private constructor(props: IEnderecoProps) {
    super();
    this.rua = props.rua;
    this.numero = props.numero;
    this.cidade = props.cidade;
  }

  static create(props: IEnderecoProps): Endereco {
    return new Endereco(props);
  }
}

// 3. Comparacao estrutural
const end1 = Endereco.create({
  rua: FString.createOrThrow("Rua das Flores"),
  numero: FInt.createOrThrow(100),
  cidade: FString.createOrThrow("Curitiba"),
});

const end2 = Endereco.create({
  rua: FString.createOrThrow("Rua das Flores"),
  numero: FInt.createOrThrow(100),
  cidade: FString.createOrThrow("Curitiba"),
});

end1.equals(end2); // true — mesmos valores

// Serializar
const json = end1.toJson();
// { rua: "Rua das Flores", numero: 100, cidade: "Curitiba" }
```

## Heranca

`ValueObject` e a classe base para `Dto`, que adiciona campos especificos para transporte HTTP. Veja [Dto](/domain-models/dto) para mais detalhes.
