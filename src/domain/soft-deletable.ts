export interface ISoftDeletable {
  deletedAt?: Date;
  readonly isDeleted: boolean;
  softDelete(): void;
  restore(): void;
}
