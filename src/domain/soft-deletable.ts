export interface SoftDeletable {
  deletedAt?: Date;
  readonly isDeleted: boolean;
  softDelete(): void;
  restore(): void;
}
