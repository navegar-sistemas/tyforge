import type { ISchema } from "./schema-types";

export function composeSchema<A extends ISchema, B extends ISchema>(base: A, extension: B): A & B {
  return { ...base, ...extension };
}
