/**
 * Exchanges two fields of a state object and returns a new object, so the
 * common two-field swap is one line:
 *
 *     setRoute((route) => swapValues(route, "from", "to"));
 *
 * Pure, and in its own module so a Server Component can import it too.
 */
export function swapValues<T extends object, A extends keyof T, B extends keyof T>(state: T, a: A, b: B): T {
  return { ...state, [a]: state[b], [b]: state[a] };
}
