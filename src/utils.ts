export function isMobileUA(ua: string): boolean {
  return /Mobile|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

export function invariant<T>(
  value: T,
  error: string,
): asserts value is NonNullable<T> {
  if (!value) {
    throw new Error(error);
  }
}
