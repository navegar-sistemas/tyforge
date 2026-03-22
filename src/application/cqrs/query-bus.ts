import { IQuery } from "./query";

export interface IQueryBus {
  dispatch<TResult>(query: IQuery): Promise<TResult>;
}
