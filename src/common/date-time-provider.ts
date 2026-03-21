export interface DateTimeProvider {
  now(): Date;
}

export class DefaultDateTimeProvider implements DateTimeProvider {
  now(): Date {
    return new Date();
  }
}
