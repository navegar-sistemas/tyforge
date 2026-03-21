export class Paginated<T> {
  constructor(
    readonly items: T[],
    readonly total: number,
    readonly page: number,
    readonly pageSize: number,
  ) {}

  get totalPages(): number {
    return Math.ceil(this.total / this.pageSize);
  }
}
