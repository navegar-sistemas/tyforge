import { Command } from "./command";

export interface CommandBus {
  dispatch<TResult = void>(command: Command): Promise<TResult>;
}
