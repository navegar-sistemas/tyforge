export interface Policy<TInput, TOutput> {
  execute(input: TInput): TOutput;
}
