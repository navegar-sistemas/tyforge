export interface IPolicy<TInput, TOutput> {
  execute(input: TInput): TOutput;
}
