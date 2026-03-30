export interface IDateTimeProvider {
  now(): Date;
}

export class DefaultDateTimeProvider implements IDateTimeProvider {
  now(): Date {
    return new Date();
  }
}
