import { DomainEvent } from "@tyforge/domain-models/domain-event.base";
import { IOutboxEntry } from "./outbox-entry";

/**
 * Transactional Outbox Pattern
 *
 * Garante entrega confiavel de domain events para sistemas externos.
 * O fluxo funciona em duas fases:
 *
 * 1. **Fase transacional**: ao persistir o aggregate, a entrada de outbox
 *    e salva na mesma transacao do banco de dados (via `store()`).
 *    Isso garante atomicidade — se o aggregate for salvo, o evento
 *    tambem sera salvo; se a transacao falhar, ambos sao revertidos.
 *
 * 2. **Fase de publicacao**: um job em background (polling ou CDC) le
 *    as entradas pendentes via `getPending()` e publica cada evento
 *    no message broker (ex: RabbitMQ, SQS, Kafka).
 *
 * 3. **Confirmacao**: apos entrega bem-sucedida ao broker, a entrada
 *    e marcada como publicada via `markAsPublished()`, evitando
 *    reprocessamento.
 *
 * Exemplo de uso:
 * ```typescript
 * // Dentro do repositorio (mesma transacao)
 * await repository.save(aggregate);
 * for (const event of aggregate.domainEvents) {
 *   await outbox.store(event);
 * }
 * aggregate.clearEvents();
 *
 * // Job em background (processo separado)
 * const pending = await outbox.getPending();
 * for (const entry of pending) {
 *   await messageBroker.publish(entry);
 *   await outbox.markAsPublished(entry.id);
 * }
 * ```
 */
export interface IOutbox {
  /** Armazena o evento na tabela de outbox (dentro da mesma transacao do aggregate) */
  store(event: DomainEvent): Promise<void>;
  /** Marca a entrada como publicada apos entrega bem-sucedida ao broker */
  markAsPublished(eventId: string): Promise<void>;
  /** Retorna entradas pendentes de publicacao para o job de background */
  getPending(): Promise<IOutboxEntry[]>;
}
