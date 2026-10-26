"use client";

import { Component, Fragment, type ComponentProps, type ErrorInfo, type ReactNode } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { Alert, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** What a fallback function receives. */
export interface FallbackProps {
  /** What was thrown, as an Error even when the code threw a string. */
  error: Error;
  /** Puts the children back, with their state rebuilt from scratch. */
  reset: () => void;
}

export interface ErrorBoundaryProps {
  /** The subtree to protect. */
  children?: ReactNode;
  /** What to show instead of the children when one of them throws: a node, or a function that gets the error and `reset` and returns one. A function can only be passed from a Client Component. The default is one sentence and a Try again button. `null` shows nothing. */
  fallback?: ReactNode | ((props: FallbackProps) => ReactNode);
  /** Called once per error, with React's component stack: the place for your logger (Sentry, an endpoint). */
  onError?: (error: Error, info: ErrorInfo) => void;
  /** Called when the boundary resets, whether by `reset` or because a reset key changed. */
  onReset?: () => void;
  /** The boundary resets by itself when any of these changes between two renders: a route, an id, a filter. Compared with Object.is, like a hook's dependencies. */
  resetKeys?: readonly unknown[];
}

interface State {
  error: Error | null;
  /** Counts the resets. It is the key of the children, so a reset mounts them anew instead of rendering the same broken instances again. */
  attempt: number;
}

const changed = (a: readonly unknown[] = [], b: readonly unknown[] = []) => a.length !== b.length || a.some((item, index) => !Object.is(item, b[index]));

export interface ErrorFallbackProps extends Omit<ComponentProps<typeof Alert>, "children"> {
  /** The sentence. Default "Something went wrong while showing this section." */
  children?: ReactNode;
  /** Shows the button, and runs this when it is pressed. Pass `reset` here. */
  onRetry?: () => void;
  /** The text on the button. Default "Try again". */
  retryLabel?: string;
}

/**
 * The fallback an ErrorBoundary shows by default, and a good start for your
 * own: one plain sentence, an icon and a Try again button, in the destructive
 * tone. It says nothing about what broke, because a person reading it cannot
 * do anything with a stack trace; that goes to your logger through `onError`.
 * It announces itself the moment it appears.
 */
export function ErrorFallback({ children = "Something went wrong while showing this section.", onRetry, retryLabel = "Try again", className, ...props }: ErrorFallbackProps) {
  return (
    // The words are darkened toward the foreground so they reach 4.5:1 on the pale red fill; the icon keeps the plain destructive colour.
    <Alert data-slot="error-fallback" tone="destructive" role="alert" className={cn("text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_25%)]", className)} {...props}>
      <IconAlertCircle />
      <AlertTitle>{children}</AlertTitle>
      {onRetry ? (
        <div className="col-start-2 mt-1.5">
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </Alert>
  );
}

/**
 * Catches an error thrown while rendering any of its children and shows a
 * fallback in their place, so one broken widget does not take the page with
 * it. The rest of the page keeps working. `reset` really resets: it mounts
 * the children again from nothing, so state that caused the crash is gone,
 * and `resetKeys` does the same on its own when a route, an id or a filter
 * changes. `onError` is the hook for your logger.
 *
 * It catches errors of the client render and of the lifecycle. It does not
 * catch errors in event handlers, in async code, or on the server, where your
 * framework's error page (error.tsx in Next.js) is the boundary.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  override state: State = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return { error: error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error") };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  override componentDidUpdate(previous: ErrorBoundaryProps, before: State) {
    // Only an error that was already showing is reset by a key: the update that caught it may well have changed the keys itself.
    if (this.state.error !== null && before.error !== null && changed(previous.resetKeys, this.props.resetKeys)) this.reset();
  }

  reset = () => {
    this.props.onReset?.();
    this.setState((state) => ({ error: null, attempt: state.attempt + 1 }));
  };

  override render() {
    const { error, attempt } = this.state;
    if (error === null) return <Fragment key={attempt}>{this.props.children}</Fragment>;
    const { fallback } = this.props;
    if (typeof fallback === "function") return fallback({ error, reset: this.reset });
    return fallback === undefined ? <ErrorFallback onRetry={this.reset} /> : fallback;
  }
}
