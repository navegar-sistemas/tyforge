export interface PipelineBehavior<TInput, TOutput> {
  handle(input: TInput, next: () => Promise<TOutput>): Promise<TOutput>;
}
