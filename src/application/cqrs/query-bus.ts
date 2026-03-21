import { Query } from "./query";

export interface QueryBus {
  dispatch<TResult>(query: Query): Promise<TResult>;
}
