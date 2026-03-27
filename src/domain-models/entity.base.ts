import { FId } from "@tyforge/type-fields/id.format_vo";
import { ClassDomainModels } from "./class-domain-models.base";

export interface IEntityProps {
  id?: FId;
}

export abstract class Entity<
  TProps extends IEntityProps,
  TPropsJson = unknown,
> extends ClassDomainModels<TProps, TPropsJson> {
  readonly id?: FId;

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
