/**
 * Assertion function for narrowing `unknown` to a generic type `T`.
 * Used where runtime logic guarantees the shape but TypeScript cannot verify it statically.
 */
export function assertType<T>(value: unknown): asserts value is T {
  void value;
}
