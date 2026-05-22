export function invariant<T>(
  value: T,
  error: string,
): asserts value is NonNullable<T> {
  if (!value) {
    throw new Error(error);
  }
}
