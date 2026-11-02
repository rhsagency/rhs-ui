"use client";

import { useState, type ComponentProps } from "react";

import { CopyField } from "@rhs-ui/application/copy-field";
import { IconArrowRight } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";
import { cn } from "@/lib/utils";

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiEndpoint {
  /** The HTTP method. It is written out on the row, so it never depends on colour. */
  method: ApiMethod;
  /** The path after the base URL: "/customers/{id}". A parameter, written {id} or :id, is dimmed so the fixed part stands out. */
  path: string;
  /** One line on what it does: "Retrieve a customer by id." */
  description: string;
  /** The reference page for this endpoint. */
  href: string;
}

export interface ApiEndpointGroup {
  /** The resource the endpoints belong to: "Customers". */
  label: string;
  /** One line under the label, for a resource that needs a sentence. */
  description?: string;
  /** The endpoints of the resource, in the order you want them listed. */
  endpoints: readonly ApiEndpoint[];
}

export interface ApiEndpointsLabels {
  /** The words over the base URL. */
  baseUrl: string;
  /** The accessible name of the base URL's copy button. */
  copyBaseUrl: string;
  /** Names the row of method chips for assistive technology. */
  filter: string;
  /** The first chip, which shows every endpoint. */
  all: string;
  /** The word for one endpoint, used in the counts. */
  endpoint: string;
  /** The word for any other number of endpoints. */
  endpoints: string;
  /** Said, politely, when a chip narrows the list. {shown}, {total} and {noun} stand for the two counts and the word. */
  showing: string;
  /** Said when nothing narrows the list. {total} and {noun} stand for the count and the word. */
  showingAll: string;
  /** The link on every row. */
  reference: string;
  /** Read out after the link's text, so twelve "Reference" links are not twelve identical words: "Reference for GET /customers". */
  forName: string;
  /** The link beside the heading, when `docsHref` is set. */
  fullReference: string;
}

export interface ApiEndpointsProps extends Omit<ComponentProps<"section">, "title" | "children" | "defaultValue" | "onChange"> {
  /** The small line over the heading: "API". */
  eyebrow?: string;
  /** The heading: "Everything the dashboard can do, over HTTP". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The endpoints, grouped by resource. Groups and endpoints keep the order you give them. */
  groups: readonly ApiEndpointGroup[];
  /** The address every path hangs from: "https://api.northwind.example/v1". It sits over the list in a copy field. */
  baseUrl?: string;
  /** The full reference. It becomes a link beside the heading. */
  docsHref?: string;
  /** The method shown at first when you do not control it. All endpoints when left out. */
  defaultMethod?: ApiMethod;
  /** The method shown when you control the block. "all" stands for the first chip. */
  method?: ApiMethod | "all";
  /** Called with the method after a chip is chosen. "all" stands for the first chip. */
  onMethodChange?: (method: ApiMethod | "all") => void;
  /** The level of the heading: 2 by default. The resource headings sit one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ApiEndpointsLabels>;
}

const LABELS: ApiEndpointsLabels = {
  baseUrl: "Base URL",
  copyBaseUrl: "Copy base URL",
  filter: "Filter endpoints by method",
  all: "All",
  endpoint: "endpoint",
  endpoints: "endpoints",
  showing: "Showing {shown} of {total} {noun}",
  showingAll: "Showing all {total} {noun}",
  reference: "Reference",
  forName: "for",
  fullReference: "Full API reference",
};

const ALL = "all";
/** The order the chips come in: reading first, then creating, then changing, then removing. */
const ORDER: readonly ApiMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

/**
 * The methods are told apart by their word first and by weight and shape second, never by colour: a read is quiet
 * and outlined, a create is solid, a change is a strong outline, and a delete is a strong dashed one.
 */
const METHOD: Record<ApiMethod, string> = {
  GET: "border-border bg-transparent font-medium text-muted-foreground",
  POST: "border-transparent bg-foreground font-semibold text-background",
  PUT: "border-foreground bg-transparent font-semibold text-foreground",
  PATCH: "border-foreground bg-transparent font-semibold text-foreground",
  DELETE: "border-dashed border-foreground bg-transparent font-bold text-foreground",
};

/**
 * The chips are separate pills, not the joined bar a ToggleGroup draws by default. The chosen one is filled; in
 * forced colours, where fills are dropped, it gets an outline as well.
 */
const CHIP =
  "group/chip h-8 gap-2 rounded-full border-l px-3.5 text-[0.8125rem] first:rounded-full last:rounded-full forced-colors:data-[state=on]:outline-2 forced-colors:data-[state=on]:-outline-offset-2 forced-colors:data-[state=on]:outline-solid";

/**
 * The base URL stays on one line beside its button while it fits. When it does not, the button drops under it, and
 * a URL still too long for the line wraps instead of hiding its end behind a scrollbar. Its characters are never
 * joined into ligatures: what is shown is exactly what is copied.
 */
const CODE = "[&>div]:flex-wrap [&>div]:justify-end [&_code]:flex-auto [&_code]:whitespace-normal [&_code]:[overflow-wrap:anywhere] [&_code]:[font-variant-ligatures:none]";

const LINK =
  "group/link inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** A parameter is {id} or :id. Splitting on it keeps the separators at the odd positions. */
const PARAMETER = /(\{[^}]+\}|:[A-Za-z_]\w*)/;

function Path({ path }: { path: string }): React.JSX.Element {
  return (
    <>
      {path.split(PARAMETER).map((part, index) =>
        index % 2 === 1 ? (
          <span key={index} className="text-muted-foreground">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * What can I do with this API? A ruled list of every endpoint, grouped by
 * resource, where a code sample only answers what one call looks like. Each row
 * has the method as a word in a fixed-width label (GET, POST, PATCH and DELETE
 * differ in weight and shape, not in colour), the path in monospace with its
 * parameters dimmed, a line on what it does and a link to its reference. The
 * base URL sits over the list in a copy field. Chips filter by method, show
 * how many endpoints each holds, and say politely how many are on screen. On a
 * wide block a row is four columns; on a narrow one it stacks as method and
 * path, then the description, then the link. Paths are real, selectable text.
 */
export function ApiEndpoints({
  eyebrow,
  title,
  description,
  groups,
  baseUrl,
  docsHref,
  defaultMethod,
  method,
  onMethodChange,
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: ApiEndpointsProps) {
  const labels = { ...LABELS, ...custom };
  const all = groups.flatMap((group) => group.endpoints);
  // Only the methods something uses, in reading order: a chip that would show nothing is never offered.
  const offered = ORDER.filter((name) => all.some((endpoint) => endpoint.method === name));
  const known = (value: string | undefined): value is ApiMethod | "all" => value === ALL || offered.some((name) => name === value);
  const [own, setOwn] = useState<ApiMethod | "all">(known(defaultMethod) ? defaultMethod : ALL);
  const requested = method ?? own;
  const current = known(requested) ? requested : ALL;
  const Resource = `h${headingLevel + 1}` as "h3" | "h4";

  const shownGroups = groups
    .map((group) => ({ group, endpoints: current === ALL ? group.endpoints : group.endpoints.filter((endpoint) => endpoint.method === current) }))
    .filter((entry) => entry.endpoints.length > 0);
  const shown = shownGroups.reduce((sum, entry) => sum + entry.endpoints.length, 0);
  const noun = (count: number) => (count === 1 ? labels.endpoint : labels.endpoints);
  const message = (shown === all.length ? labels.showingAll : labels.showing).replace("{shown}", String(shown)).replace("{total}", String(all.length)).replace("{noun}", noun(all.length));

  const choose = (next: string) => {
    // Pressing the chosen chip again would clear a single choice; the list always has one.
    if (!known(next) || next === current) return;
    if (method === undefined) setOwn(next);
    onMethodChange?.(next);
  };

  // On the chosen chip the count is a shade lighter than the chip's word (light text on the dark fill, far above 4.5:1
  // at 80%). On the others it keeps the chip's own colour: dimming a muted colour again would depend on how dark the
  // theme's muted-foreground happens to be.
  const chipCount = (total: number) => (
    <>
      <span aria-hidden="true" className="tabular-nums group-data-[state=on]/chip:opacity-80">
        {total}
      </span>
      <span className="sr-only">
        , {total} {noun(total)}
      </span>
    </>
  );

  return (
    <section data-slot="api-endpoints" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
        as={headingLevel === 3 ? "h3" : "h2"}
        action={
          docsHref ? (
            <a href={docsHref} className={LINK}>
              {labels.fullReference}
              <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
            </a>
          ) : undefined
        }
      />

      {baseUrl ? (
        <div className="mt-10 max-w-2xl @3xl:mt-12">
          <p className="mb-2 text-sm font-medium">{labels.baseUrl}</p>
          <CopyField value={baseUrl} label={labels.copyBaseUrl} className={CODE} />
        </div>
      ) : null}

      {offered.length > 1 ? (
        <div className={cn("flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between @2xl:gap-8", baseUrl ? "mt-6" : "mt-10 @3xl:mt-12")}>
          <ToggleGroup
            type="single"
            size="sm"
            aria-label={labels.filter}
            value={current}
            onValueChange={choose}
            className="flex w-full flex-wrap gap-2 rounded-none data-[variant=outline]:shadow-none @2xl:w-auto"
          >
            <ToggleGroupItem value={ALL} className={CHIP}>
              {labels.all}
              {chipCount(all.length)}
            </ToggleGroupItem>
            {offered.map((name) => (
              <ToggleGroupItem key={name} value={name} className={cn(CHIP, "font-mono")}>
                {name}
                {chipCount(all.filter((endpoint) => endpoint.method === name).length)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p role="status" aria-live="polite" className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {message}
          </p>
        </div>
      ) : null}

      <div className={cn("grid gap-12", baseUrl || offered.length > 1 ? "mt-10" : "mt-10 @3xl:mt-12")}>
        {shownGroups.map(({ group, endpoints }, groupIndex) => (
          <div key={`${groupIndex}-${group.label}`}>
            <div className="flex items-baseline justify-between gap-4 border-b border-foreground pb-3">
              <Resource className="min-w-0 text-xl leading-snug font-semibold tracking-[-0.025em]">{group.label}</Resource>
              <p className="shrink-0 text-sm text-muted-foreground tabular-nums">
                {endpoints.length} {noun(endpoints.length)}
              </p>
            </div>
            {group.description ? <p className="mt-3 mb-1 max-w-2xl text-sm leading-relaxed text-pretty text-muted-foreground">{group.description}</p> : null}
            <ul role="list">
              {endpoints.map((endpoint) => (
                <li
                  key={`${endpoint.method}-${endpoint.path}`}
                  className="grid grid-cols-[4rem_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2 border-b border-border py-4 @2xl:grid-cols-[4rem_minmax(0,1.1fr)_minmax(0,1fr)_auto] @2xl:gap-x-6 @2xl:py-3.5 @4xl:grid-cols-[4rem_minmax(0,0.9fr)_minmax(0,1.3fr)_auto]"
                >
                  <Badge variant="outline" className={cn("h-6 w-16 rounded-md px-0 font-mono text-[0.6875rem] tracking-[0.04em]", METHOD[endpoint.method])}>
                    {endpoint.method}
                  </Badge>
                  <code className="min-w-0 font-mono text-[0.8125rem] leading-snug [overflow-wrap:anywhere]">
                    <Path path={endpoint.path} />
                  </code>
                  <p className="col-start-2 text-sm leading-relaxed text-pretty text-muted-foreground @2xl:col-start-auto">{endpoint.description}</p>
                  <a href={endpoint.href} className={cn(LINK, "col-start-2 decoration-transparent @2xl:col-start-auto @2xl:justify-self-end")}>
                    <span>
                      {labels.reference}
                      <span className="sr-only">
                        {" "}
                        {labels.forName} {endpoint.method} {endpoint.path}
                      </span>
                    </span>
                    <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
