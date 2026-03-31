import { Result, ok, err } from "@tyforge/result";

export class Optional<T> {
  private constructor(private readonly _value: T | null) {}

  static of<T>(value: T): Optional<T> {
    return new Optional(value);
  }

  static empty<T>(): Optional<T> {
    return new Optional<T>(null);
  }

  isPresent(): boolean {
    return this._value !== null;
  }

  // Throws by design — use isPresent() before calling,
  // or use orElse() for safe access
  get(): T {
    if (this._value === null) throw new Error("Value not present");
    return this._value;
  }

  /** Safe alternative to get() — returns a Result instead of throwing */
  getResult(): Result<T, Error> {
    if (this._value === null) {
      return err(new Error("Value not present"));
    }
    return ok(this._value);
  }

  orElse(fallback: T): T {
    return this._value !== null ? this._value : fallback;
  }

  map<U>(fn: (value: T) => U): Optional<U> {
    return this._value !== null
      ? Optional.of(fn(this._value))
      : Optional.empty<U>();
  }
}
