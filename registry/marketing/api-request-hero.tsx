import { Fragment, type ComponentProps, type ReactNode } from "react";

import { CopyField } from "@rhs-ui/application/copy-field";
import { IconAlertCircle, IconArrowDownLeft, IconArrowRight, IconArrowUpRight, IconCheckCircle, IconInfo, IconTimer } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { CodeBlock } from "@rhs-ui/primitives/code-block";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface ApiRequestHeroRequest {
  /** The HTTP method, written as you want it read: "POST". It is set in capitals before the URL. */
  method: string;
  /** The full URL a developer would call. The host is muted and the path leads; a long one wraps, it is never cut. */
  url: string;
  /** The request body as text to read and copy. Pretty-print it yourself: it is shown exactly as written. Leave it out for a GET. */
  body?: string;
  /** Names the body in the code header: "json", "xml". */
  language?: string;
  /** Line numbers (from 1) to draw attention to in the body. */
  highlight?: readonly number[];
}

export interface ApiRequestHeroResponse {
  /** The status as written: "201 Created". Its first digit sets the icon: 2 is a check, 3 an arrow, 4 and 5 an alert in the destructive colour. */
  status: string;
  /** How long the call took, in milliseconds. */
  ms: number;
  /** The response body as text to read and copy, pretty-printed. */
  body: string;
  /** Names the body in the code header: "json". */
  language?: string;
  /** Line numbers (from 1) to draw attention to in the body. */
  highlight?: readonly number[];
}

export interface ApiRequestHeroLabels {
  /** The first pane and its tab. */
  request: string;
  /** The second pane and its tab. */
  response: string;
  /** Read before the status by a screen reader: "Status: 201 Created". */
  status: string;
  /** Read before the latency: "Latency: 214 milliseconds". */
  latency: string;
  /** The unit read out loud after the number. */
  milliseconds: string;
}

const LABELS: ApiRequestHeroLabels = { request: "Request", response: "Response", status: "Status", latency: "Latency", milliseconds: "milliseconds" };

export interface ApiRequestHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** A short line above the title: the name of the API or the product area. */
  eyebrow?: string;
  /** The pitch, in a line. */
  title: string;
  /** One or two sentences under the title. */
  description?: string;
  /** The install command, copied as written: "npm install @northwind/sdk". */
  install: string;
  /** The copy button's name. */
  installLabel?: string;
  /** Where the documentation lives. */
  docsHref: string;
  /** The text of the docs link. */
  docsLabel?: string;
  /** The call: method, URL and body. */
  request: ApiRequestHeroRequest;
  /** What came back: status, latency and body. */
  response: ApiRequestHeroResponse;
  /** The example's accessible name. */
  exampleLabel?: string;
  /** Locale for the latency figure. */
  locale?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ApiRequestHeroLabels>;
}

type Tone = "success" | "redirect" | "error" | "info";

/** The first digit of "201 Created" decides how the status is drawn; anything unreadable is neutral. */
function toneOf(status: string): Tone {
  const digit = /^\s*([1-5])\d\d\b/.exec(status)?.[1];
  return digit === "2" ? "success" : digit === "3" ? "redirect" : digit === "4" || digit === "5" ? "error" : "info";
}

/** "https://api.northwind.dev/v1/shipments" -> the host part and the path, so the path can lead. */
function splitUrl(url: string): { origin: string; path: string } {
  const match = /^([a-z][a-z\d+.-]*:\/\/[^/?#]+)(.*)$/i.exec(url);
  return match ? { origin: match[1] ?? "", path: match[2] ?? "" } : { origin: "", path: url };
}

/** A URL with a place to break after every slash and every dot, so a long one wraps between its parts and not in the middle of a word. */
function Breakable({ text }: { text: string }) {
  return text.split(/(?<=[/.])/).map((part, index) => (
    <Fragment key={`${index}-${part}`}>
      {part}
      <wbr />
    </Fragment>
  ));
}

/** The pane's name sits in a fixed column on a wide screen, so the method and the status start on one line in both panes. */
function PaneName({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p aria-hidden="true" className="hidden w-[4.75rem] shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground md:flex [&>svg]:size-3.5">
      {icon}
      {children}
    </p>
  );
}

/**
 * The opening for a developer tool: the pitch, an install command and a docs
 * link on the left, and on the right one bordered card holding a single call
 * and what came back, each body in a CodeBlock with its own copy button. The
 * response says its status and its latency in words as well as in the icon
 * and the figure. It is static on purpose: the whole example is in the page
 * at once, with no typing animation, so it is complete for everyone,
 * including screen readers, and it shows what one call looks like rather than
 * a recorded session. On a phone the two panes become two tabs, with arrow
 * keys to move between them; from a tablet up both are on show.
 */
export function ApiRequestHero({
  titleAs: Title = "h2",
  eyebrow,
  title,
  description,
  install,
  installLabel = "Copy install command",
  docsHref,
  docsLabel = "Read the API reference",
  request,
  response,
  exampleLabel = "Example request and response",
  locale = "en-US",
  labels,
  className,
  ...props
}: ApiRequestHeroProps) {
  const words = { ...LABELS, ...labels };
  const tone = toneOf(response.status);
  const code = /^\s*(\d{3})\b/.exec(response.status)?.[1];
  const latency = new Intl.NumberFormat(locale).format(response.ms);
  const { origin, path } = splitUrl(request.url);
  const StatusIcon = tone === "error" ? IconAlertCircle : tone === "redirect" ? IconArrowRight : tone === "info" ? IconInfo : IconCheckCircle;
  /* The code sits flush in the card: no box of its own, a hairline above it. */
  const flush = "rounded-none border-0 border-t border-border bg-muted/40 [&_figcaption]:h-9 [&_figcaption]:border-b-0 [&_pre]:pt-1";

  return (
    <section data-slot="api-request-hero" className={cn("grid grid-cols-1 items-center gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16", className)} {...props}>
      <div className="min-w-0">
        {eyebrow ? <p className="mb-4 text-sm font-medium text-muted-foreground">{eyebrow}</p> : null}
        <Title className="text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title>
        {description ? <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p> : null}
        {/* CopyField scrolls a long value sideways, which hides the end of the command on a phone. Here the command wraps instead, so all of it stays readable at any width; on the narrowest phones it also drops a size, so a package name is not broken after its last letter but one. */}
        <CopyField value={install} label={installLabel} className="mt-8 max-w-md max-[340px]:[&_code]:text-xs [&_code]:whitespace-normal [&_code]:[overflow-wrap:anywhere]" />
        <Button asChild variant="link" className="mt-3 h-auto px-0 py-1">
          <a href={docsHref}>
            {docsLabel}
            <IconArrowRight />
          </a>
        </Button>
      </div>

      {/* One set of panes for both layouts: from md both show, below it the tabs choose one. Every pane stays mounted, so the text is in the page and the width never jumps. */}
      <Tabs
        defaultValue="request"
        role="group"
        aria-label={exampleLabel}
        data-slot="api-request-hero-card"
        className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm"
      >
        <div className="border-b border-border p-2 md:hidden">
          <TabsList variant="pill" className="grid w-full grid-cols-2">
            <TabsTrigger value="request">{words.request}</TabsTrigger>
            <TabsTrigger value="response">
              {words.response}
              {code ? <span className="text-xs font-normal text-muted-foreground tabular-nums">{code}</span> : null}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="request" forceMount tabIndex={-1} data-slot="api-request-hero-request" className="min-w-0 data-[state=inactive]:max-md:hidden">
          <div className="flex items-baseline gap-3 px-4 py-3.5">
            <PaneName icon={<IconArrowUpRight />}>{words.request}</PaneName>
            <Badge variant="secondary" className="h-6 shrink-0 rounded-md px-2 font-mono text-[0.6875rem] tracking-wide uppercase">
              {request.method}
            </Badge>
            <p className="min-w-0 font-mono text-[0.8125rem] leading-6 [overflow-wrap:anywhere]">
              {origin ? (
                <span className="text-muted-foreground">
                  <Breakable text={origin} />
                </span>
              ) : null}
              <span className="font-medium">
                <Breakable text={path} />
              </span>
            </p>
          </div>
          {request.body ? <CodeBlock code={request.body} language={request.language ?? "json"} highlight={request.highlight} className={flush} /> : null}
        </TabsContent>

        <TabsContent value="response" forceMount tabIndex={-1} data-slot="api-request-hero-response" className="min-w-0 data-[state=inactive]:max-md:hidden md:border-t md:border-border">
          <div className="flex items-baseline gap-3 px-4 py-3.5">
            <PaneName icon={<IconArrowDownLeft />}>{words.response}</PaneName>
            {/* The destructive tint alone is 3.9:1 in the light theme at this size; the text takes a share of the ink colour to reach 4.5:1 and stays red. */}
            <Badge
              variant={tone === "error" ? "destructive" : "secondary"}
              className={cn(
                "h-6 gap-1.5 rounded-md px-2 text-[0.8125rem] tabular-nums [&>svg]:size-3.5",
                tone === "error" && "bg-destructive/10 text-[color:color-mix(in_oklch,var(--destructive)_68%,var(--foreground))]",
              )}
            >
              <StatusIcon />
              <span className="sr-only">{words.status}: </span>
              {response.status}
            </Badge>
            <p className="ml-auto flex shrink-0 items-center gap-1.5 self-center text-xs text-muted-foreground tabular-nums">
              <IconTimer className="size-3.5" />
              <span className="sr-only">
                {words.latency}: {latency} {words.milliseconds}
              </span>
              <span aria-hidden="true">{latency} ms</span>
            </p>
          </div>
          <CodeBlock code={response.body} language={response.language ?? "json"} highlight={response.highlight} className={flush} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
