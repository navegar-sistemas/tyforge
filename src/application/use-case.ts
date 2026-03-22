import { Class } from "@tyforge/domain-models/class.base";

export abstract class UseCase<TInput, TOutput> extends Class {
  abstract execute(input: TInput): Promise<TOutput>;
}
