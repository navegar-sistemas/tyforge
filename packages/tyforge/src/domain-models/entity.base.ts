import { FId } from "@tyforge/type-fields/identity/id.typefield";
import { FIdSeq } from "@tyforge/type-fields/identity/id-seq.typefield";
import { ClassDomainModels } from "./class-domain-models.base";

export type TEntityId = FId | FIdSeq;

export interface IEntityProps {
  id?: TEntityId;
}

export abstract class Entity<
  TProps extends IEntityProps,
  TPropsJson = unknown,
> extends ClassDomainModels<TProps, TPropsJson> {
  readonly id?: TEntityId;

  protected constructor() {
    super();
  }

  public equals(other: this): boolean {
    if (!other) return false;
    if (this === other) return true;
    if (other.constructor !== this.constructor) return false;
    if (!this.id || !other.id) return false;
    return this.id.getValue() === other.id.getValue();
  }
}
