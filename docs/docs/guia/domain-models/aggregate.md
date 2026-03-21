---
title: Aggregate
sidebar_position: 4
---

# Aggregate

Um **Aggregate** e uma Entity que atua como raiz de consistencia e emite eventos de dominio. Toda modificacao de estado no agregado pode gerar um ou mais `DomainEvent` que serao consumidos por outros componentes do sistema.

## Assinatura

```typescript
abstract class Aggregate<
  TProps extends IEntityPropsBase,
  TPropsJson = unknown,
> extends Entity<TProps, TPropsJson> {
  private _domainEvents: DomainEvent[] = [];

  protected constructor();

  // Adiciona evento (protegido — somente subclasses)
  protected addDomainEvent(event: DomainEvent): void;

  // Retorna copia congelada dos eventos
  public getDomainEvents(): ReadonlyArray<DomainEvent>;

  // Limpa todos os eventos (apos publicacao)
  public clearDomainEvents(): void;
}
```

## Domain Events

### Metodos do Aggregate

| Metodo | Visibilidade | Descricao |
|--------|-------------|-----------|
| `addDomainEvent(event)` | `protected` | Adiciona um evento a lista interna. Somente a propria classe pode emitir eventos |
| `getDomainEvents()` | `public` | Retorna um `ReadonlyArray` congelado (`Object.freeze`) com todos os eventos pendentes |
| `clearDomainEvents()` | `public` | Limpa a lista de eventos. Deve ser chamado apos a publicacao dos eventos |

### `DomainEvent<TPayload>`

Classe abstrata que representa um evento de dominio:

```typescript
abstract class DomainEvent<TPayload = Record<string, unknown>> {
  readonly id: string;            // UUID v7 (gerado automaticamente)
  readonly eventName: string;     // Nome do evento
  readonly payload: TPayload;     // Dados do evento
  readonly occurredAt: Date;      // Momento da ocorrencia
  readonly version: string;       // "1.0.0"
  abstract readonly queueName: TQueueName; // Fila de destino

  constructor(eventName: string, payload: TPayload, occurredAt?: Date);

  toJson(): {
    id: string;
    eventName: string;
    payload: TPayload;
    occurredAt: string; // ISO string
    version: string;
    queueName: string;
  };
}
```

**Campos:**
- `id` — UUID v7 gerado automaticamente, garante unicidade e ordenacao temporal
- `eventName` — nome descritivo do evento (ex.: `"PedidoCriado"`)
- `payload` — dados arbitrarios tipados pelo generico `TPayload`
- `occurredAt` — timestamp do evento (padrao: `new Date()`)
- `version` — versao do schema do evento, fixo em `"1.0.0"`
- `queueName` — abstrato, deve ser definido pela subclasse (nome da fila/topico de destino)

## Exemplo completo

```typescript
import { Aggregate, IEntityPropsBase, DomainEvent, FId, FString, FInt } from "tyforge";

// 1. Defina o evento de dominio
class PedidoCriadoEvent extends DomainEvent<{
  pedidoId: string;
  clienteNome: string;
  total: number;
}> {
  readonly queueName = "pedidos.criado";

  constructor(pedidoId: string, clienteNome: string, total: number) {
    super("PedidoCriado", { pedidoId, clienteNome, total });
  }
}

// 2. Defina os tipos do agregado
interface IPedidoProps extends IEntityPropsBase {
  id?: FId;
  cliente: FString;
  total: FInt;
}

interface IPedidoJson {
  id?: string;
  cliente: string;
  total: number;
}

// 3. Implemente o Aggregate
class Pedido extends Aggregate<IPedidoProps, IPedidoJson> {
  protected readonly _classInfo = {
    name: "Pedido",
    version: "1.0.0",
    description: "Agregado de pedido",
  };

  override id?: FId;
  cliente: FString;
  total: FInt;

  private constructor(props: IPedidoProps) {
    super();
    this.id = props.id;
    this.cliente = props.cliente;
    this.total = props.total;
  }

  static criar(props: IPedidoProps): Pedido {
    const pedido = new Pedido(props);

    // Emitir evento de dominio
    pedido.addDomainEvent(
      new PedidoCriadoEvent(
        pedido.id?.getValue() ?? "",
        pedido.cliente.getValue(),
        pedido.total.getValue(),
      ),
    );

    return pedido;
  }
}

// 4. Use o Aggregate
const pedido = Pedido.criar({
  id: FId.generate(),
  cliente: FString.createOrThrow("Maria Silva"),
  total: FInt.createOrThrow(15000),
});

// Acessar eventos pendentes
const eventos = pedido.getDomainEvents();
console.log(eventos.length); // 1
console.log(eventos[0].eventName); // "PedidoCriado"
console.log(eventos[0].toJson());
// {
//   id: "uuid-v7",
//   eventName: "PedidoCriado",
//   payload: { pedidoId: "...", clienteNome: "Maria Silva", total: 15000 },
//   occurredAt: "2024-01-15T10:30:00.000Z",
//   version: "1.0.0",
//   queueName: "pedidos.criado"
// }

// Limpar apos publicacao
pedido.clearDomainEvents();
pedido.getDomainEvents().length; // 0
```

## Fluxo tipico de domain events

1. O Aggregate executa uma operacao de negocio
2. Dentro da operacao, chama `this.addDomainEvent(new MeuEvento(...))`
3. O repositorio (ou unit of work) persiste o agregado
4. Apos persistencia bem-sucedida, publica os eventos via `getDomainEvents()`
5. Chama `clearDomainEvents()` para limpar a fila

Esse padrao garante que eventos so sejam publicados apos a persistencia ter sucesso, evitando inconsistencias entre estado e eventos.
