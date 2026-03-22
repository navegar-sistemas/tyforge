import { Class } from "@tyforge/domain-models/class.base";

/**
 * Base abstrata para Use Cases da camada de aplicacao.
 *
 * Decisao de design: `execute()` retorna `Promise<TOutput>` e propaga erros
 * via throw na fronteira da aplicacao. Isso e intencional — domain models
 * usam Result<T, E> para error handling funcional nos hot paths, enquanto
 * use cases convertem falhas em exceptions para consumo direto por controllers
 * e middlewares de erro do framework HTTP. Essa separacao mantem o dominio
 * puro (sem dependencia de framework) e simplifica o tratamento de erros
 * na camada de apresentacao.
 */
export abstract class UseCase<TInput, TOutput> extends Class {
  abstract execute(input: TInput): Promise<TOutput>;
}
