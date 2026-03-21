import ExceptionUnexpected from "@tyforge/exceptions/unexpected";

export type Result<T, E = string> = Success<T> | Failure<E>;
export type ResultPromise<T, E> = Promise<Result<T, E>>;
interface Success<T> {
  success: true;
  value: T;
}

interface Failure<E> {
  success: false;
  error: E;
}

export const ok = <T>(value: T): Result<T, never> => ({ success: true, value });
export const err = <E>(error: E): Result<never, E> => ({
  success: false,
  error,
});

export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> =>
  result.success;
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> =>
  !result.success;

export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> => (isSuccess(result) ? ok(fn(result.value)) : result);

export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> => (isSuccess(result) ? fn(result.value) : result);

export const fold = <T, E, R>(
  result: Result<T, E>,
  onSuccess: (value: T) => R,
  onFailure: (error: E) => R,
): R => (isSuccess(result) ? onSuccess(result.value) : onFailure(result.error));

export const getOrElse = <T, E>(
  result: Result<T, E>,
  defaultValue: T | (() => T),
): T =>
  isSuccess(result)
    ? result.value
    : typeof defaultValue === "function"
      ? (defaultValue as () => T)()
      : defaultValue;

export const orElse = <T, E>(
  result: Result<T, E>,
  alternative: Result<T, E>,
): Result<T, E> => (isSuccess(result) ? result : alternative);

export const match = <T, E, R>(
  result: Result<T, E>,
  handlers: { success: (value: T) => R; failure: (error: E) => R },
): R => fold(result, handlers.success, handlers.failure);

export const toPromise = <T, E>(result: Result<T, E>): Promise<T> =>
  isSuccess(result)
    ? Promise.resolve(result.value)
    : Promise.reject(
        result.error instanceof Error
          ? result.error
          : (() => {
              try {
                return new Error(String(result.error));
              } catch {
                return ExceptionUnexpected.create({ message: "Failed to convert error to string" });
              }
            })(),
      );

export const all = <T, E>(results: Result<T, E>[]): Result<T[], E> => {
  const values: T[] = [];
  for (const r of results) {
    if (isFailure(r)) return r;
    values.push(r.value);
  }
  return ok(values);
};
