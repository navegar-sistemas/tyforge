import { ICommand } from "./command";

export interface ICommandBus {
  dispatch<TResult = void>(command: ICommand): Promise<TResult>;
}
