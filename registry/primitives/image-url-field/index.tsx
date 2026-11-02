"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type ClipboardEvent } from "react";

import { IconAlertCircle, IconCheck, IconClose, IconImage } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DEFAULT_LABELS, readAddress, type ImageUrlLabels, type ImageUrlState } from "@rhs-ui/primitives/image-url-field/urls";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

export type { ImageUrlLabels, ImageUrlState, ImageUrlStatus } from "@rhs-ui/primitives/image-url-field/urls";

export interface ImageUrlFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "children"> {
  /** The address, when you control it. */
  value?: string;
  /** The address to start with, when you do not control it. */
  defaultValue?: string;
  /** Called with the address on every change, and again when the image has loaded or failed. `state` says which, and the size of the image in pixels once it is known. */
  onValueChange?: (url: string, state: ImageUrlState) => void;
  /** Turn down http:// addresses without asking the network. Default false. */
  requireHttps?: boolean;
  /** Accept data:image/ addresses. Default false, because they can be very long. */
  allowData?: boolean;
  /** How many milliseconds the typing has to stop before the address is loaded, so half an address is not requested. A pasted address is loaded at once. Default 500. */
  debounce?: number;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<ImageUrlLabels>;
}

/** An image that has not answered after this long counts as failed. */
const TIMEOUT = 15000;

interface Outcome {
  src: string;
  ok: boolean;
  width: number | null;
  height: number | null;
}

/**
 * Paste the address of an image and see it load. A thumbnail in the field
 * shows the picture, a skeleton while it is on its way and a mark when it
 * failed, and a line under the field says what happened in words: the size in
 * pixels, or "That address did not load as an image". The preview is a plain
 * image element, so no script fetches anything and no server is involved; the
 * request carries no referrer, and the thumbnail has an empty alt because the
 * label already names the field. Addresses that are not https:// (or http://
 * unless `requireHttps`) or, when allowed, data:image/ are refused before any
 * request is made. The status is announced politely.
 */
export function ImageUrlField({
  value,
  defaultValue = "",
  onValueChange,
  requireHttps = false,
  allowData = false,
  debounce = 500,
  labels: labelOverrides,
  disabled,
  readOnly,
  className,
  onPaste,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  ref,
  ...props
}: ImageUrlFieldProps) {
  const uid = useId();
  const statusId = `${uid}-status`;
  const labels: ImageUrlLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [own, setOwn] = useState(defaultValue);
  const text = value ?? own;
  const read = readAddress(text, { requireHttps, allowData });
  const wanted = read && "src" in read ? read.src : null;
  // The address the image element is loading. It follows `wanted` after the typing pauses.
  const [target, setTarget] = useState<string | null>(wanted);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [mounted, setMounted] = useState(false);
  const input = useRef<HTMLInputElement | null>(null);
  const pasted = useRef(false);
  // The last change was typed, so the image waits for a pause. A pasted address, or one that comes from outside, loads at once.
  const delayed = useRef(false);
  const reported = useRef<string>("");
  const started = useRef(false);
  const report = useRef(onValueChange);

  // The field keeps the ref you pass and uses its own to move the focus.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useEffect(() => {
    report.current = onValueChange;
  });

  // The image element only exists in the browser: one that finished loading before React was listening would never say so.
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (wanted === target) return;
    if (wanted === null || !delayed.current) {
      setTarget(wanted);
      return;
    }
    const timer = window.setTimeout(() => {
      delayed.current = false;
      setTarget(wanted);
    }, debounce);
    return () => window.clearTimeout(timer);
  }, [wanted, target, debounce]);

  // An image that never answers is a failed one.
  useEffect(() => {
    if (!mounted || target === null) return;
    const timer = window.setTimeout(() => setOutcome((now) => (now?.src === target ? now : { src: target, ok: false, width: null, height: null })), TIMEOUT);
    return () => window.clearTimeout(timer);
  }, [mounted, target]);

  /** What is known about an address right now: nothing typed, refused, on its way, or already answered. */
  function stateFor(address: string): ImageUrlState {
    const parsed = readAddress(address, { requireHttps, allowData });
    if (parsed === null) return { status: "empty", width: null, height: null };
    if ("refusal" in parsed) return { status: "invalid", width: null, height: null };
    const known = outcome?.src === parsed.src ? outcome : null;
    if (!known) return { status: "loading", width: null, height: null };
    return known.ok ? { status: "loaded", width: known.width, height: known.height } : { status: "failed", width: null, height: null };
  }

  const state = stateFor(text);
  const { status, width, height } = state;
  const signature = `${text}|${status}|${width}|${height}`;

  // Whatever changes what is known is reported, also when the address came from outside or the image has only now answered. What was reported
  // from the typing itself is not reported twice, and at the start only a settled state is news.
  useEffect(() => {
    const first = !started.current;
    started.current = true;
    if (reported.current === signature) return;
    reported.current = signature;
    if (first && status === "loading") return;
    report.current?.(text, { status, width, height });
  }, [signature, text, status, width, height]);

  function tell(address: string) {
    const next = stateFor(address);
    reported.current = `${address}|${next.status}|${next.width}|${next.height}`;
    onValueChange?.(address, next);
  }

  function change(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    delayed.current = !pasted.current;
    pasted.current = false;
    if (value === undefined) setOwn(next);
    tell(next);
  }

  function paste(event: ClipboardEvent<HTMLInputElement>) {
    onPaste?.(event);
    // A pasted address is whole: there is nothing to wait for.
    pasted.current = true;
  }

  function clear() {
    delayed.current = false;
    if (value === undefined) setOwn("");
    tell("");
    input.current?.focus();
  }

  const sentence =
    status === "empty"
      ? labels.hint
      : status === "loading"
        ? labels.loading
        : status === "loaded"
          ? labels.loaded(width, height)
          : status === "failed"
            ? labels.failed
            : read && "refusal" in read
              ? labels[read.refusal]
              : labels.address;
  const bad = status === "failed" || status === "invalid";
  const named = props.id !== undefined || ariaLabel !== undefined || labelledBy !== undefined;

  return (
    <div data-slot="image-url-field" data-status={status} className={cn("grid w-full min-w-0 grid-cols-1", className)}>
      <InputGroup className={cn("h-11", "has-[input[aria-invalid=true]:focus-visible]:border-destructive has-[input[aria-invalid=true]:focus-visible]:ring-destructive/30")}>
        <InputGroupAddon aria-hidden="true" className="pr-0 pl-1.5">
          <span className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-sm border border-border bg-muted">
            {status === "loading" ? (
              <>
                <Skeleton className="absolute inset-0 rounded-none" />
                <Spinner size={14} label="" className="relative text-muted-foreground" />
              </>
            ) : status === "empty" || bad ? (
              <IconImage className={cn("size-4", bad && "text-destructive")} />
            ) : null}
            {mounted && target !== null && status !== "invalid" && status !== "empty" ? (
              <img
                key={target}
                src={target}
                alt=""
                referrerPolicy="no-referrer"
                decoding="async"
                draggable={false}
                onLoad={(event) => setOutcome({ src: target, ok: true, width: event.currentTarget.naturalWidth || null, height: event.currentTarget.naturalHeight || null })}
                onError={() => setOutcome({ src: target, ok: false, width: null, height: null })}
                className={cn("absolute inset-0 size-full object-cover transition-opacity duration-200 motion-reduce:transition-none", status === "loaded" ? "opacity-100" : "opacity-0")}
              />
            ) : null}
          </span>
        </InputGroupAddon>
        <InputGroupInput
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="https://"
          {...props}
          ref={attach}
          disabled={disabled}
          readOnly={readOnly}
          value={text}
          aria-label={named ? ariaLabel : labels.name}
          aria-labelledby={labelledBy}
          aria-invalid={bad ? true : undefined}
          aria-describedby={[describedBy, statusId].filter(Boolean).join(" ")}
          onChange={change}
          onPaste={paste}
        />
        {text !== "" && !disabled && !readOnly ? (
          <Button type="button" variant="ghost" size="icon-sm" onClick={clear} aria-label={labels.clear} className="mr-1 size-7 shrink-0 text-muted-foreground hover:text-foreground">
            <IconClose />
          </Button>
        ) : null}
      </InputGroup>
      <div role="status" id={statusId}>
        <p className={cn("mt-1.5 flex items-start gap-1.5 text-xs", bad ? "text-destructive" : status === "loaded" ? "text-foreground" : "text-muted-foreground")}>
          {bad ? <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" /> : status === "loaded" ? <IconCheck aria-hidden="true" className="mt-px size-3.5 shrink-0" /> : null}
          <span className="min-w-0 tabular-nums [overflow-wrap:anywhere]">{sentence}</span>
        </p>
      </div>
    </div>
  );
}
