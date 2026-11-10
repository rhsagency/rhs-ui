"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { flushSync } from "react-dom";

import { Badge } from "@rhs-ui/primitives/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface FormTab {
  /** Identifies the tab: what `value` and `errorCounts` are keyed by. */
  id: string;
  /** What the tab says: "Pricing". */
  label: string;
  /** The fields of this tab. They stay in the page while another tab is shown, so the form still sends them. */
  content: ReactNode;
}

/** The words the tabs say, for translation. `{count}`, `{problems}` and `{total}` are numbers. */
export interface FormTabsLabels {
  /** The name of the list of tabs. Default "Form sections". */
  list?: string;
  /** Said after the name of a tab with one problem. Default "{count} problem". */
  problemOne?: string;
  /** Said after the name of a tab with more. Default "{count} problems". */
  problemOther?: string;
  /** Under the tabs while some have problems. Default "Problems in {problems} of {total} tabs". */
  summary?: string;
  /** Under the tabs once the last problem is gone. Default "No problems left". */
  clean?: string;
}

export interface FormTabsProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The tabs, in order. */
  tabs: readonly FormTab[];
  /** The tab that is shown, when you control it. */
  value?: string;
  /** The tab that is shown to begin with. Default the first. */
  defaultValue?: string;
  /** Called with the id of the tab that was chosen, or that was opened to show a field that failed. */
  onValueChange?: (id: string) => void;
  /** How many problems each tab has, by tab id, from your own validation (the server said no). A tab not named here counts as the browser's own validation finds it, and a 0 clears it. */
  errorCounts?: Readonly<Record<string, number>>;
  /** The words the tabs say, for translation. */
  labels?: FormTabsLabels;
}

const DEFAULT_LABELS = {
  list: "Form sections",
  problemOne: "{count} problem",
  problemOther: "{count} problems",
  summary: "Problems in {problems} of {total} tabs",
  clean: "No problems left",
} satisfies Required<FormTabsLabels>;

/** How far from the ends of the strip an opened tab is kept, so it is clear of the fade that says there is more. */
const EDGE = 40;

/** The fade at an end of the strip. It is only there while there are tabs beyond that end. */
const FADE_BEFORE = "[mask-image:linear-gradient(to_left,#000_calc(100%_-_1.5rem),transparent)]";
const FADE_AFTER = "[mask-image:linear-gradient(to_right,#000_calc(100%_-_1.5rem),transparent)]";
const FADE_BOTH = "[mask-image:linear-gradient(to_right,transparent,#000_1.5rem,#000_calc(100%_-_1.5rem),transparent)]";

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** How many fields in a panel the browser finds invalid. A group of radios with nothing chosen is one problem, not one per radio. */
function problemsIn(panel: HTMLElement): number {
  const groups = new Set<string>();
  let count = 0;
  for (const field of panel.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")) {
    if (!field.willValidate || field.validity.valid) continue;
    if (field instanceof HTMLInputElement && field.type === "radio") {
      if (groups.has(field.name)) continue;
      groups.add(field.name);
    }
    count += 1;
  }
  return count;
}

/**
 * A long form split across tabs that still submits as one. Every panel stays in the page, so one form sends all of them
 * and what was typed survives a switch of tab; put FormTabs inside your `<form>`. A tab with problems says so in text
 * ("Pricing, 2 problems", with the number beside the name), and a thin line under the tabs fills with the share of tabs that are
 * clean. The browser cannot reach a field in a hidden panel: it refuses to submit and says nothing. So when a submit
 * fails, the first invalid field's tab opens, the field takes focus and the browser's own message points at it. The
 * problems are counted from the browser's validation (`required`, `pattern`, `min`) unless you give `errorCounts`, which
 * is for what only your server knows. Arrow keys, Home and End move between the tabs. In a narrow form the tabs tighten so
 * three with a count still fit; when they do not, the strip scrolls, fades at the end that has more and brings the tab
 * that opens into view, also when a failed submit opened it.
 */
export function FormTabs({ tabs, value, defaultValue, onValueChange, errorCounts, labels, className, ...props }: FormTabsProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState(defaultValue ?? tabs[0]?.id ?? "");
  const current = value ?? own;
  /** What the browser's validation found, once a submit has failed. */
  const [found, setFound] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [seen, setSeen] = useState(false);

  function change(id: string) {
    if (value === undefined) setOwn(id);
    onValueChange?.(id);
  }

  // The listeners live as long as the component and read the latest of these when they run.
  const latest = useRef({ change, checked });
  useEffect(() => {
    latest.current = { change, checked };
  });

  useEffect(() => {
    const node = root.current;
    const form = node?.closest("form");
    if (!node || !form) return;
    let reporting = false;
    let first: HTMLElement | null = null;
    let timer: number | undefined;

    const recount = () => {
      const next: Record<string, number> = {};
      for (const panel of node.querySelectorAll<HTMLElement>("[data-form-tab-panel]")) next[panel.dataset.formTabPanel ?? ""] = problemsIn(panel);
      setFound(next);
    };

    // A failed submit fires `invalid` on every bad field, in page order. The browser would try to focus the first one, fail when its panel is hidden and stay silent,
    // so the first one is taken over: its tab is opened and the field is focused, then the browser is asked to point at it.
    const onInvalid = (event: Event) => {
      const field = event.target;
      if (reporting || !(field instanceof HTMLElement) || !node.contains(field)) return;
      // A field above the tabs that is also invalid comes first in the page, and the browser deals with it: that one is not ours to take over.
      const earliest = [...form.elements].find((control) => (control as HTMLInputElement).willValidate && !(control as HTMLInputElement).validity.valid);
      if (earliest && !node.contains(earliest)) return;
      event.preventDefault();
      if (first) return;
      first = field;
      timer = window.setTimeout(() => {
        const target = first;
        first = null;
        if (!target?.isConnected) return;
        setChecked(true);
        recount();
        const id = target.closest<HTMLElement>("[data-form-tab-panel]")?.dataset.formTabPanel;
        if (id) flushSync(() => latest.current.change(id));
        reporting = true;
        target.focus();
        (target as HTMLInputElement).reportValidity?.();
        reporting = false;
      }, 0);
    };
    const onEdit = () => {
      if (latest.current.checked) recount();
    };
    // A submit that gets through had no problems, so the line starts over.
    const onSubmit = () => {
      setChecked(false);
      setFound({});
    };

    form.addEventListener("invalid", onInvalid, true);
    form.addEventListener("input", onEdit);
    form.addEventListener("change", onEdit);
    form.addEventListener("submit", onSubmit);
    return () => {
      form.removeEventListener("invalid", onInvalid, true);
      form.removeEventListener("input", onEdit);
      form.removeEventListener("change", onEdit);
      form.removeEventListener("submit", onSubmit);
      window.clearTimeout(timer);
    };
  }, []);

  /** Which ends of the strip have tabs beyond them, so that end can fade and say so. */
  const [more, setMore] = useState({ before: false, after: false });
  useEffect(() => {
    const list = strip.current;
    if (!list) return;
    const measure = () => {
      const before = list.scrollLeft > 1;
      const after = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
      setMore((previous) => (previous.before === before && previous.after === after ? previous : { before, after }));
    };
    measure();
    list.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    if (list.firstElementChild) observer.observe(list.firstElementChild);
    return () => {
      list.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);

  // The strip scrolls without a bar. A tab that opens other than by a click on it (a failed submit does) must not wait out of sight.
  const arrived = useRef(false);
  useEffect(() => {
    const list = strip.current;
    const tab = list?.querySelector<HTMLElement>('[role="tab"][data-state="active"]');
    const first = !arrived.current;
    arrived.current = true;
    if (!list || !tab || list.scrollWidth <= list.clientWidth) return;
    const start = tab.offsetLeft - EDGE;
    const end = tab.offsetLeft + tab.offsetWidth + EDGE - list.clientWidth;
    const left = list.scrollLeft > start ? start : list.scrollLeft < end ? end : list.scrollLeft;
    if (Math.abs(left - list.scrollLeft) < 1) return;
    list.scrollTo({ left: Math.max(0, left), behavior: first || window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [current]);

  const total = tabs.length;
  const counts: Record<string, number> = { ...found, ...errorCounts };
  const withProblems = tabs.filter((tab) => (counts[tab.id] ?? 0) > 0).length;
  const known = checked || errorCounts !== undefined;
  const share = known && total > 0 ? ((total - withProblems) / total) * 100 : 0;
  useEffect(() => {
    if (withProblems > 0) setSeen(true);
  }, [withProblems]);
  const summary = withProblems > 0 ? fill(text.summary, { problems: withProblems, total }) : seen && known ? text.clean : "";
  const problemsText = (count: number) => fill(count === 1 ? text.problemOne : text.problemOther, { count });

  return (
    <div
      ref={root}
      data-slot="form-tabs"
      className={cn(
        // A field the person has been at, or that a failed submit found, shows it. Where the browser does not know the pseudo-class the rule is dropped, and the message still comes.
        "[&_:is(input,textarea,select):user-invalid]:border-destructive [&_:is(input,textarea,select):user-invalid:focus-visible]:ring-destructive/30",
        className,
      )}
      {...props}
    >
      <Tabs value={current} onValueChange={change} className="gap-0">
        {/* A container, so the tabs tighten when the form itself is narrow: three tabs with a count then still fit in 20 rem. */}
        <div className="@container flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {/* Padded and pulled back out, so the focus ring on a tab is not cut off by the scroll area. Its ends fade while there is more beyond them. */}
          <div
            ref={strip}
            className={cn("relative -m-1 max-w-full overflow-x-auto p-1 [scrollbar-width:none]", more.before && more.after ? FADE_BOTH : more.after ? FADE_AFTER : more.before ? FADE_BEFORE : null)}
          >
            <TabsList variant="pill" aria-label={text.list}>
              {tabs.map((tab) => {
                const problems = counts[tab.id] ?? 0;
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="@max-[19rem]:gap-1 @max-[19rem]:text-[0.8125rem] @max-[19rem]:group-data-[variant=pill]/list:px-2">
                    {tab.label}
                    {problems > 0 ? (
                      <>
                        {/* Red on its own faint red: the plain token is under 4.5:1 here in the light theme, so the number takes a share of the foreground. */}
                        <Badge variant="destructive" aria-hidden="true" className="h-4.5 min-w-4.5 px-1.5 text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)] tabular-nums @max-[19rem]:px-1">
                          {problems}
                        </Badge>
                        <span className="sr-only">{`, ${problemsText(problems)}`}</span>
                      </>
                    ) : null}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          <p role="status" className="text-xs text-muted-foreground">
            {summary}
          </p>
        </div>

        {/* How many tabs are clean, as the length of a line. The words above and the counts on the tabs say the same, so it is for the eye only. */}
        <div aria-hidden="true" className="mt-3 h-0.5 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-foreground transition-[width] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${share}%` }} />
        </div>

        {tabs.map((tab) => (
          // forceMount keeps every panel in the page; the ones that are not shown are display: none, which is what the form still sends.
          <TabsContent
            key={tab.id}
            value={tab.id}
            forceMount
            tabIndex={-1}
            data-form-tab-panel={tab.id}
            className="pt-6 outline-none transition-opacity duration-200 starting:opacity-0 motion-reduce:transition-none data-[state=inactive]:hidden"
          >
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
