"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type FocusEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { IconArrowRight, IconChevronDown, IconExternal, IconHelp, IconPushpin } from "@rhs-ui/icons";
import { DEFAULT_LABELS, type FieldHelp, type FieldHelpPanelLabels, type Words } from "@rhs-ui/application/field-help-panel/help";
import { Button } from "@rhs-ui/primitives/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { cn } from "@/lib/utils";

export type { FieldHelp, FieldHelpPanelLabels } from "@rhs-ui/application/field-help-panel/help";

export interface FieldHelpPanelProps extends Omit<ComponentProps<"div">, "children"> {
  /** The help, by field id: a title, a body, and optionally an example, what happens next and a link. A field feeds the panel by carrying its id in `data-help-id`, on the field itself or on whatever wraps its label, control and hint. */
  help: Readonly<Record<string, FieldHelp>>;
  /** The form. Any element inside it with a `data-help-id` that is a key of `help` shows that help while the focus is in it. */
  children: ReactNode;
  /** The key of the help to show when no field with help has the focus: the general note. */
  defaultId: string;
  /** The level of the help's title in the panel. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** Classes for the panel, to change where it sticks (the default is `lg:top-6`) or how wide it is. */
  panelClassName?: string;
  /** The words the panel says, for translation. */
  labels?: FieldHelpPanelLabels;
}

/** From this width (Tailwind's `lg`) the panel stands beside the form. Below it the help is a bar above the form and a bar under the field that has the focus. */
const WIDE = "(min-width: 64rem)";

/** Elements that cannot hold children, so the bar under such a field goes after it and not inside it. */
const VOID = /^(?:INPUT|TEXTAREA|SELECT|BUTTON|IMG|BR|HR)$/;

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Whether an element has a popup open (a Select, a date picker, a popover): the focus is then inside that popup, which is portaled out of the
 * form. The disclosure of the help's own bars does not count.
 */
function opensPopup(element: Element): boolean {
  return element.getAttribute("aria-expanded") === "true" && !element.closest("[data-slot='field-help-inline-panel']");
}

/** The field a popup belongs to: the one whose control points at the popup with aria-controls, which is how a Select, a combobox or a popover names its list. */
function ownerOf(popup: HTMLElement, form: HTMLElement): HTMLElement | null {
  for (let node: HTMLElement | null = popup; node; node = node.parentElement) {
    if (!node.id) continue;
    const control = form.querySelector(`[aria-controls~="${CSS.escape(node.id)}"]`);
    if (control) return control.closest<HTMLElement>("[data-help-id]");
  }
  return null;
}

/** The help for one field, as the panel and the bars both show it. */
function HelpBody({ item, text, Title }: { item: FieldHelp; text: Words; Title?: "h2" | "h3" | "h4" }) {
  const external = item.link ? /^https?:/.test(item.link.href) : false;
  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        {Title ? <Title className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.015em] text-balance">{item.title}</Title> : null}
        <div className="text-sm leading-relaxed text-pretty text-muted-foreground [&_p+p]:mt-2">{item.body}</div>
      </div>
      {item.example ? (
        <div className="grid gap-1.5">
          <p className="text-xs leading-4 font-medium text-muted-foreground">{text.example}</p>
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2 font-mono text-[0.8125rem] leading-5 break-words text-foreground">{item.example}</p>
        </div>
      ) : null}
      {item.next ? (
        <div className="flex items-start gap-2.5">
          <IconArrowRight aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="grid gap-0.5 text-sm leading-5">
            <p className="font-medium">{text.next}</p>
            <p className="text-muted-foreground">{item.next}</p>
          </div>
        </div>
      ) : null}
      {item.link ? (
        <a
          href={item.link.href}
          {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
          className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm leading-5 font-medium underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          {item.link.label}
          {external ? <IconExternal aria-hidden="true" className="size-3.5" /> : <IconArrowRight aria-hidden="true" className="size-3.5" />}
        </a>
      ) : null}
    </div>
  );
}

/**
 * Whatever `children` renders for an id, cross-fading when the id changes: the
 * new help fades in over the old, which fades out above it and is removed.
 * Under reduced motion the swap is instant and the old one is never shown.
 */
function Faded({ id, children }: { id: string; children: (id: string) => ReactNode }) {
  const [layer, setLayer] = useState({ id, fade: false, tick: 0 });
  const [leaving, setLeaving] = useState<{ id: string; tick: number } | null>(null);
  if (layer.id !== id) {
    // Under reduced motion the old help is not kept for a fade that will not be shown.
    if (!(typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) setLeaving({ id: layer.id, tick: layer.tick });
    setLayer({ id, fade: true, tick: layer.tick + 1 });
  }
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setLeaving(null), 240);
    return () => window.clearTimeout(timer);
  }, [leaving]);
  return (
    <div className="relative">
      {leaving ? (
        <div key={`out-${leaving.tick}`} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 motion-safe:animate-rhs-help-out motion-reduce:hidden">
          {children(leaving.id)}
        </div>
      ) : null}
      <div key={`in-${layer.tick}`} className={layer.fade ? "motion-safe:animate-rhs-help-in" : undefined}>
        {children(layer.id)}
      </div>
    </div>
  );
}

function PinButton({ pinned, onToggle, text, className }: { pinned: boolean; onToggle: () => void; text: Words; className?: string }) {
  return (
    <Button type="button" variant={pinned ? "secondary" : "ghost"} size="sm" aria-pressed={pinned} onClick={onToggle} className={cn("shrink-0 text-muted-foreground aria-pressed:text-foreground", className)}>
      <IconPushpin aria-hidden="true" className={pinned ? "fill-current" : undefined} />
      {text.pin}
    </Button>
  );
}

interface HelpBarProps {
  item: FieldHelp;
  text: Words;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The Pin of a bar under a field and whether it is pinned. The bar of the general note has none. */
  pin?: { pinned: boolean; onToggle: () => void };
  /** Fade in when the bar appears, as the bar under a field does. */
  enter?: boolean;
}

/** The help of one question as a bar for phones and tablets: its title, a chevron and, under a field, a Pin. Its title is the one line it takes until it is opened. */
function HelpBar({ item, text, open, onOpenChange, pin, enter = false }: HelpBarProps) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} data-slot="field-help-inline-panel" className={cn("rounded-lg border border-border bg-muted/40", enter && "motion-safe:animate-rhs-help-in")}>
      <div className="flex items-center gap-1 pr-1.5">
        <CollapsibleTrigger className="group/help flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2.5 text-start text-[0.8125rem] leading-5 font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
          <IconHelp aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="line-clamp-2 min-w-0 flex-1 text-pretty">{item.title}</span>
          <IconChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=open]/help:rotate-180 motion-reduce:transition-none" />
        </CollapsibleTrigger>
        {pin ? <PinButton pinned={pin.pinned} onToggle={pin.onToggle} text={text} /> : null}
      </div>
      <CollapsibleContent>
        <div className="px-3 pt-1 pb-3.5">
          <HelpBody item={item} text={text} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * A side panel of help that follows the field in focus, for long or sensitive
 * forms where a hint line is too little: tax details, identity checks,
 * applications. Put the form inside, give each field (or the wrapper of its
 * label, control and hint) a `data-help-id`, and the panel beside the form
 * shows why that question is asked, an example and what happens next while the
 * focus is in it, the general note when it is on nothing with help, and
 * cross-fades between them (an instant swap under reduced motion). Nothing
 * depends on seeing the panel: each field keeps its own short hint in
 * aria-describedby, and the panel is a labelled complementary region. A Pin
 * button stops it from changing while someone reads. Below 1024px the panel
 * does not exist as a column: the general note is a bar above the form, and
 * the help of the field you are in is a bar inside that field, one line until
 * it is opened. Nothing above the field moves when it takes the focus, the bar
 * stays under the last field you were in, and a bar that is open stays where
 * it is when the focus moves on.
 */
export function FieldHelpPanel({ help, children, defaultId, headingLevel = 3, panelClassName, labels, className, ref, onBlur: onBlurProp, ...props }: FieldHelpPanelProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const regionId = useId();
  const root = useRef<HTMLDivElement | null>(null);
  const area = useRef<HTMLDivElement>(null);
  const leave = useRef(0);
  // A press inside the panel must not read as the focus leaving: Safari does not focus a button that is clicked.
  const holdUntil = useRef(0);
  // The bars under the fields (phones and tablets): one box per field, made here and put inside the field, because the field is the user's markup.
  const made = useRef(new Map<string, HTMLElement>());
  // A press that moves the focus must not move the page under the finger: the tap would land on whatever slid into its place. The bar waits for the click.
  const pointerAt = useRef(Number.NEGATIVE_INFINITY);
  const queued = useRef<string | null>(null);
  const wait = useRef(0);
  const [focusId, setFocusId] = useState<string | null>(null);
  // The last field with help that had the focus: the bar under a field stays when the focus goes to a button or leaves the form.
  const [stayId, setStayId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<readonly string[]>([]);
  const [barOpen, setBarOpen] = useState(false);
  const [hosts, setHosts] = useState<ReadonlyMap<string, HTMLElement>>(() => new Map());
  const [said, setSaid] = useState("");
  const wide = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE).matches,
    () => true,
  );

  // A ref and an onBlur of the consumer's are kept: the panel's own ref and handler are composed with them, not replaced by them.
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  const Title = `h${headingLevel}` as "h2" | "h3" | "h4";
  const known = (id: string | null): id is string => id !== null && Object.hasOwn(help, id);
  const fallbackId = Object.keys(help)[0] ?? defaultId;
  const itemOf = (id: string): FieldHelp | undefined => help[id] ?? help[defaultId] ?? help[fallbackId];
  const shownId = known(pinnedId) ? pinnedId : known(focusId) ? focusId : defaultId;
  // The field the help is about on a phone: the pinned one, or the last one that had the focus.
  const anchorId = known(pinnedId) ? pinnedId : known(stayId) ? stayId : null;
  // The fields that have a bar inside them: that one, and any whose bar is open. The general note has its own bar above the form, so it needs no second one.
  const slotIds = wide ? [] : [...new Set([...(anchorId === null ? [] : [anchorId]), ...openIds])].filter((id) => known(id) && id !== defaultId);
  const general = itemOf(defaultId);
  const render = (id: string) => {
    const item = itemOf(id);
    return item ? <HelpBody item={item} text={text} Title={Title} /> : null;
  };

  // Make a box inside each field that has a bar and take it away from the ones that do not. It goes in the field, as the last thing in it, so the form's own grid is left alone.
  useEffect(() => {
    const form = area.current;
    if (!form) return;
    const boxes = made.current;
    let changed = false;
    for (const [id, host] of [...boxes]) {
      if (!slotIds.includes(id)) {
        host.remove();
        boxes.delete(id);
        changed = true;
      }
    }
    for (const id of slotIds) {
      const field = form.querySelector<HTMLElement>(`[data-help-id="${CSS.escape(id)}"]`);
      let host = boxes.get(id);
      if (!field) {
        if (host) {
          host.remove();
          boxes.delete(id);
          changed = true;
        }
        continue;
      }
      if (!host) {
        host = document.createElement("div");
        host.dataset.slot = "field-help-inline";
        host.className = "col-span-full mt-1 min-w-0 empty:hidden";
        boxes.set(id, host);
        changed = true;
      }
      if (host.parentElement !== field && host.previousElementSibling !== field) {
        if (VOID.test(field.tagName)) field.after(host);
        else field.append(host);
      }
    }
    if (changed) setHosts(new Map(boxes));
  });

  useEffect(
    () => () => {
      window.clearTimeout(leave.current);
      window.clearTimeout(wait.current);
      for (const host of made.current.values()) host.remove();
      made.current.clear();
    },
    [],
  );

  function release() {
    window.clearTimeout(wait.current);
    const id = queued.current;
    if (id === null) return;
    // A list that is open hangs on its field: the bar moves once the list is closed and the focus is back on the field.
    if (Array.from(area.current?.querySelectorAll("[aria-expanded='true']") ?? []).some(opensPopup)) return;
    queued.current = null;
    setStayId(id);
  }

  /** Whether taking the bar away from the field it is under now would move the field `id`: it would when that bar is above it. A bar that is open stays, so it moves nothing. */
  function shifts(id: string): boolean {
    const old = anchorId === null || openIds.includes(anchorId) ? undefined : made.current.get(anchorId);
    const field = area.current?.querySelector(`[data-help-id="${CSS.escape(id)}"]`);
    return old !== undefined && Boolean(field) && ((old.compareDocumentPosition(field as Element) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0);
  }

  /** The bar goes to a field. When a press caused the focus and the move would shift that field, it waits until the click is over (or a moment has passed), so the press lands where it was aimed. */
  function follow(id: string) {
    window.clearTimeout(wait.current);
    if (performance.now() - pointerAt.current > 600 || !shifts(id)) {
      queued.current = null;
      setStayId(id);
      return;
    }
    queued.current = id;
    wait.current = window.setTimeout(release, 450);
  }

  function onFocus(event: FocusEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const form = area.current;
    if (!form) return;
    // A list that a field opened (a Select, a date picker) is portaled out of the form, but React still bubbles its focus here. It belongs to that field: the help is the field's,
    // also when a click opened the list and the field itself never took the focus. Its bar comes at once when nothing above the field moves for it, and otherwise waits until the list is closed.
    if (!form.contains(target)) {
      window.clearTimeout(leave.current);
      const owner = ownerOf(target, form)?.dataset.helpId ?? null;
      if (known(owner)) {
        setFocusId(owner);
        if (!shifts(owner)) {
          queued.current = null;
          setStayId(owner);
        }
      }
      return;
    }
    // The bars' own buttons take the focus without changing which field the help is about. The bar under a field is that field's: it stays while its buttons have the focus.
    const bar = target.closest("[data-slot='field-help-inline']");
    if (bar) {
      for (const [id, box] of made.current) if (box === bar) follow(id);
      return;
    }
    if (target.closest("[data-slot='field-help-inline-panel']")) return;
    window.clearTimeout(leave.current);
    const id = target.closest<HTMLElement>("[data-help-id]")?.dataset.helpId ?? null;
    const field = known(id) ? id : null;
    setFocusId(field);
    if (field !== null) follow(field);
  }

  function onBlur(event: FocusEvent<HTMLDivElement>) {
    onBlurProp?.(event);
    const target = event.target as HTMLElement;
    // The blurs of a list that a field opened (focus moving between its options) bubble here too, and they are not the focus leaving the form.
    if (!root.current?.contains(target)) return;
    // A field that opens a list hands the focus to it: the help stays until the list closes and the focus comes back.
    if (opensPopup(target)) {
      window.clearTimeout(leave.current);
      return;
    }
    const next = event.relatedTarget;
    // Moving to another place in the form or the panel is for onFocus to settle.
    if (next instanceof Node && root.current.contains(next)) return;
    window.clearTimeout(leave.current);
    leave.current = window.setTimeout(() => {
      if (performance.now() < holdUntil.current || root.current?.contains(document.activeElement) || opensPopup(target)) return;
      setFocusId(null);
    }, 80);
  }

  /** Pin the help of a field, or release it when it is the pinned one. Without an id it is the help that is shown. */
  function togglePin(id: string = shownId) {
    const pin = pinnedId !== id;
    setPinnedId(pin ? id : null);
    setSaid(pin ? text.pinnedNote : text.unpinnedNote);
  }

  const slots = slotIds.map((id) => {
    const host = hosts.get(id);
    const item = itemOf(id);
    if (!host || !item) return null;
    return createPortal(
      <HelpBar
        item={item}
        text={text}
        enter
        open={openIds.includes(id)}
        onOpenChange={(next) => setOpenIds((list) => (next ? [...list.filter((other) => other !== id), id] : list.filter((other) => other !== id)))}
        pin={{ pinned: pinnedId === id, onToggle: () => togglePin(id) }}
      />,
      host,
      id,
    );
  });

  return (
    <div ref={setRoot} data-slot="field-help-panel" className={cn("grid items-start gap-x-10 gap-y-6 lg:grid-cols-[minmax(0,1fr)_19rem]", className)} {...props} onBlur={onBlur}>
      <div
        ref={area}
        onFocus={onFocus}
        onPointerDownCapture={() => {
          pointerAt.current = performance.now();
        }}
        onClickCapture={() => {
          if (queued.current !== null) window.setTimeout(release, 0);
        }}
        className="min-w-0"
      >
        {general ? (
          <div data-slot="field-help-bar" className="mb-5 lg:hidden">
            <HelpBar item={general} text={text} open={barOpen} onOpenChange={setBarOpen} />
          </div>
        ) : null}
        {children}
        {slots}
      </div>

      <aside
        aria-labelledby={regionId}
        onPointerDownCapture={() => {
          holdUntil.current = performance.now() + 400;
        }}
        className={cn("hidden lg:sticky lg:top-6 lg:block", panelClassName)}
      >
        <div className="overflow-hidden rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <p id={regionId} className="inline-flex items-center gap-2 text-xs leading-5 font-medium text-muted-foreground">
              <IconHelp aria-hidden="true" className="size-4" />
              {text.region}
            </p>
            <PinButton pinned={pinnedId !== null} onToggle={() => togglePin(pinnedId ?? shownId)} text={text} className="-mr-2" />
          </div>
          <div className="mt-4">
            <Faded id={shownId}>{render}</Faded>
          </div>
        </div>
      </aside>

      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </div>
  );
}
