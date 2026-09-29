"use client";

import { useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { Toast as ToastPrimitive } from "radix-ui";

import { IconAlertCircle, IconCheckCircle, IconClose, IconInfo, IconWarning } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export type ToastTone = "default" | "success" | "info" | "warning" | "destructive";

export interface ToastOptions {
  description?: ReactNode;
  tone?: ToastTone;
  /** Milliseconds before it closes. Defaults to the Toaster's duration; Infinity keeps it open. */
  duration?: number;
  /** One action, like Undo. `altText` says how to do the same without the toast. */
  action?: { label: string; altText: string; onClick: () => void };
  /** Reuse an id to replace a toast in place, like "Saving" turning into "Saved". */
  id?: string;
}

interface ToastRecord extends ToastOptions {
  id: string;
  title: ReactNode;
  open: boolean;
}

// One small store for the whole app: toast() can be called from any event
// handler without a context, and <Toaster /> subscribes to it.
const EMPTY: readonly ToastRecord[] = [];
let records: readonly ToastRecord[] = EMPTY;
let counter = 0;
const listeners = new Set<() => void>();

function publish(next: readonly ToastRecord[]) {
  records = next;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** Show a toast. Returns its id, for dismissToast or to replace it later. */
export function toast(title: ReactNode, options: ToastOptions = {}): string {
  const id = options.id ?? `rhs-toast-${++counter}`;
  publish([...records.filter((record) => record.id !== id), { ...options, id, title, open: true }].slice(-3));
  return id;
}

/** Close one toast, or every toast when no id is given. */
export function dismissToast(id?: string): void {
  publish(records.map((record) => (id === undefined || record.id === id ? { ...record, open: false } : record)));
}

function remove(id: string) {
  publish(records.filter((record) => record.id !== id));
}

const TONE_ICON = {
  default: null,
  success: IconCheckCircle,
  info: IconInfo,
  warning: IconWarning,
  destructive: IconAlertCircle,
} as const;

export interface ToasterProps extends Omit<ComponentProps<typeof ToastPrimitive.Viewport>, "children"> {
  /** Default time on screen in ms. */
  duration?: number;
}

/**
 * Mount once, near the root. Toasts stack bottom right (bottom and full width
 * on a phone), pause while hovered or focused, swipe away to the right, and
 * F8 moves focus to them. Each one is announced politely; a destructive one
 * interrupts.
 */
export function Toaster({ className, duration = 5000, ...props }: ToasterProps) {
  const items = useSyncExternalStore(subscribe, () => records, () => EMPTY);
  return (
    <ToastPrimitive.Provider swipeDirection="right" duration={duration}>
      {items.map((item) => {
        const Icon = TONE_ICON[item.tone ?? "default"];
        return (
          <Toast
            key={item.id}
            open={item.open}
            tone={item.tone}
            duration={item.duration}
            type={item.tone === "destructive" ? "foreground" : "background"}
            onOpenChange={(open) => {
              if (open) return;
              publish(records.map((record) => (record.id === item.id ? { ...record, open: false } : record)));
              window.setTimeout(() => remove(item.id), 400);
            }}
          >
            {Icon ? <Icon size={18} className="mt-0.5 shrink-0" /> : null}
            <div className="grid min-w-0 flex-1 gap-1">
              <ToastTitle>{item.title}</ToastTitle>
              {item.description ? <ToastDescription>{item.description}</ToastDescription> : null}
            </div>
            {item.action ? (
              <ToastAction altText={item.action.altText} onClick={item.action.onClick}>
                {item.action.label}
              </ToastAction>
            ) : null}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastPrimitive.Viewport
        data-slot="toast-viewport"
        className={cn(
          "fixed inset-x-0 bottom-0 z-[100] m-0 flex max-h-dvh w-full list-none flex-col gap-2 p-4 outline-none sm:inset-x-auto sm:right-0 sm:max-w-[26rem]",
          className,
        )}
        {...props}
      />
    </ToastPrimitive.Provider>
  );
}

export interface ToastProps extends ComponentProps<typeof ToastPrimitive.Root> {
  tone?: ToastTone;
}

export function Toast({ className, tone = "default", ...props }: ToastProps) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      data-tone={tone}
      className={cn(
        "group/toast pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border border-border bg-popover p-4 pr-10 text-sm text-popover-foreground shadow-lg",
        "data-[tone=success]:[&>svg]:text-foreground data-[tone=info]:[&>svg]:text-muted-foreground data-[tone=warning]:[&>svg]:text-foreground",
        "data-[tone=destructive]:border-destructive/40 data-[tone=destructive]:[&>svg]:text-destructive",
        "data-[state=open]:animate-rhs-in data-[state=closed]:animate-rhs-fade-out",
        "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[translate] data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) data-[swipe=end]:animate-rhs-fade-out",
        "motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export function ToastTitle({ className, ...props }: ComponentProps<typeof ToastPrimitive.Title>) {
  return <ToastPrimitive.Title data-slot="toast-title" className={cn("font-medium leading-snug", className)} {...props} />;
}

export function ToastDescription({ className, ...props }: ComponentProps<typeof ToastPrimitive.Description>) {
  return <ToastPrimitive.Description data-slot="toast-description" className={cn("text-muted-foreground", className)} {...props} />;
}

export function ToastAction({ className, ...props }: ComponentProps<typeof ToastPrimitive.Action>) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center self-center rounded-md border border-border bg-background px-3 text-[0.8125rem] font-medium",
        "transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40",
        className,
      )}
      {...props}
    />
  );
}

export function ToastClose({ className, ...props }: ComponentProps<typeof ToastPrimitive.Close>) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close"
      className={cn(
        "absolute top-3 right-3 inline-flex size-6 items-center justify-center rounded-md text-muted-foreground",
        "transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40",
        className,
      )}
      {...props}
    >
      <IconClose size={14} />
    </ToastPrimitive.Close>
  );
}
