import { ClassDomainModels } from "./class-domain-models.base";

export abstract class ValueObject<TProps, TPropsJson> extends ClassDomainModels<
  TProps,
  TPropsJson
> {
  equals(input: ClassDomainModels<TProps, TPropsJson>): boolean {
    if (!input || input.constructor !== this.constructor) return false;
    return JSON.stringify(this.toJSON()) === JSON.stringify(input.toJSON());
  }
}
