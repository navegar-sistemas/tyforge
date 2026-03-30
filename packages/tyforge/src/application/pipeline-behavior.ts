export interface IPipelineBehavior<TInput, TOutput> {
  handle(input: TInput, next: () => Promise<TOutput>): Promise<TOutput>;
}
