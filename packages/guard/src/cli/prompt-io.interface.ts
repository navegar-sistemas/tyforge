export interface IPromptIO {
  question(prompt: string): Promise<string>;
  write(text: string): void;
  close(): void;
}
