import type { ComponentType, JSX } from "react";

import { ErrorBoundary, type ErrorBoundaryProps } from "@rhs-ui/primitives/error-boundary";

export interface WithErrorBoundaryOptions<P> extends Omit<ErrorBoundaryProps, "children" | "resetKeys"> {
  /** The keys that reset the boundary, worked out from the props the component gets: `(props) => [props.id]`. */
  resetKeys?: (props: P) => readonly unknown[];
}

/**
 * Wraps a component in an ErrorBoundary, for the ones you do not render
 * yourself: a third-party widget, a lazy route, a slot in someone else's
 * layout. Give it the same options as the boundary; `resetKeys` is a function
 * of the props here. Not a client module: a Server Component can wrap a client
 * component with it.
 *
 *     const SafeMap = withErrorBoundary(Map, { fallback: <p>The map is unavailable.</p> });
 */
export function withErrorBoundary<P extends object>(Wrapped: ComponentType<P>, options: WithErrorBoundaryOptions<NoInfer<P>> = {}): ComponentType<P> {
  const { resetKeys, ...boundary } = options;
  function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...boundary} resetKeys={resetKeys?.(props)}>
        <Wrapped {...(props as P & JSX.IntrinsicAttributes)} />
      </ErrorBoundary>
    );
  }
  WithErrorBoundary.displayName = `withErrorBoundary(${Wrapped.displayName ?? Wrapped.name ?? "Component"})`;
  return WithErrorBoundary;
}
