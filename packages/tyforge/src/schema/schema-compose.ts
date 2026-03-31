import type { ISchema } from "./schema-types";

/**
 * Composes two schemas by merging the base schema with an extension.
 * Fields from the extension override fields with the same key in the base.
 *
 * @param base - The base schema to extend from.
 * @param extension - The schema with additional or overriding fields.
 * @returns A new schema containing all fields from both schemas.
 */
export function composeSchema<A extends ISchema, B extends ISchema>(
  base: A,
  extension: B,
): A & B {
  return { ...base, ...extension };
}
