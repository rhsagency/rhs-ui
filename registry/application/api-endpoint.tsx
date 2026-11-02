import type { ComponentProps, ReactNode } from "react";

import { IconLock, IconUnlock, IconWarning } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { CopyButton } from "@rhs-ui/primitives/copy-button";
import { cn } from "@/lib/utils";

/** The HTTP methods an endpoint can have. Each has its own weight and outline, so none depends on colour. */
export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** The words the row uses, for translation. */
export interface ApiEndpointLabels {
  /** The mark on an endpoint that is going away. Default "Deprecated". */
  deprecated?: string;
  /** Said to screen readers before the auth, and before the method. Default "Authentication". */
  authentication?: string;
  /** What an endpoint without auth says. Default "No authentication". */
  public?: string;
  /** The copy button's name and tooltip; `{method}` and `{path}` are filled in, so every button in a list of routes has a name of its own. Default "Copy URL of {method} {path}". */
  copy?: string;
  /** The copy button once it worked. Default "Copied". */
  copied?: string;
}

export interface ApiEndpointProps extends Omit<ComponentProps<"div">, "children"> {
  /** The HTTP method. */
  method: ApiMethod;
  /** The route, with its parameters written as `:id` or `{id}`: "/v1/orders/:id". They are set in a quieter weight than the fixed parts, so the shape of the route reads at a glance. */
  path: string;
  /** One line on what it does. */
  description?: string;
  /** What it needs to be called: "Bearer token", "API key", "OAuth 2 · orders:read". `false` says it needs nothing. Leave it out to say nothing. */
  auth?: string | false;
  /** The endpoint is going away. The route is struck through and the row says "Deprecated". */
  deprecated?: boolean;
  /** The address the routes hang from: "https://api.northwind.dev". The copy button copies it with the route, so what lands on the clipboard works in a terminal. */
  baseUrl?: string;
  /** The endpoint's page in your reference. The route becomes a link and the whole row opens it; the copy button stays a separate target. */
  href?: string;
  /** The words the row uses, for translation. */
  labels?: ApiEndpointLabels;
}

const DEFAULT_LABELS = { deprecated: "Deprecated", authentication: "Authentication", public: "No authentication", copy: "Copy URL of {method} {path}", copied: "Copied" };

/** "{method}" and "{path}" in a template, filled in. */
function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/**
 * Weight, fill and outline tell the five apart in black and white: a thin
 * outline (GET), a solid fill (POST), a pale fill (PUT), a heavy outline
 * (PATCH) and a dashed one (DELETE). Only DELETE borrows the destructive token.
 */
const METHOD_LOOK: Record<ApiMethod, string> = {
  GET: "border-border bg-transparent font-medium text-foreground",
  POST: "border-transparent bg-primary font-semibold text-primary-foreground",
  PUT: "border-border bg-secondary font-semibold text-secondary-foreground",
  PATCH: "border-foreground bg-transparent font-semibold text-foreground",
  DELETE: "border-dashed border-destructive/60 bg-transparent font-semibold text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]",
};

/** A parameter of a route: `:id` or `{id}`. */
const PARAMETER = /(:[A-Za-z_]\w*|\{[^{}/]+\})/;

/** The route with the base in front: no doubled slash, and the route alone when there is no base. */
export function fullUrl(path: string, baseUrl?: string): string {
  const route = path.startsWith("/") ? path : `/${path}`;
  return baseUrl ? `${baseUrl.replace(/\/+$/, "")}${route}` : route;
}

/** The route in pieces: each fixed part and each parameter on its own, so the parameters can be set apart. A query string stays one piece. */
export function routeParts(path: string): { text: string; parameter: boolean }[] {
  const [route = "", ...query] = path.split("?");
  const parts = route
    .split(PARAMETER)
    .filter(Boolean)
    .map((text) => ({ text, parameter: PARAMETER.test(text) }));
  return query.length ? [...parts, { text: `?${query.join("?")}`, parameter: true }] : parts;
}

/** The text of a route piece with a place to break the line after every slash, so a long route folds between its parts and not in the middle of a word. */
function breakable(text: string): ReactNode[] {
  return text.split("/").flatMap((chunk, index, all) => (index < all.length - 1 ? [chunk, "/", <wbr key={index} />] : [chunk]));
}

/**
 * An API route as one row, for a reference or a developer dashboard: the
 * method as a label whose weight and outline tell GET, POST, PUT, PATCH and
 * DELETE apart without a palette, the route in monospace with its parameters
 * (`:id`, `{id}`) set in a quieter weight, one line on what it does, and what
 * it needs to be called. A copy button puts the whole URL, base included,
 * on the clipboard. A deprecated endpoint is struck through and says so in
 * words. With an `href` the route is the row's link and the copy button
 * stays its own target above it. A Server Component.
 */
export function ApiEndpoint({ method, path, description, auth, deprecated = false, baseUrl, href, labels, className, ...props }: ApiEndpointProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const verb = (method.toUpperCase() as ApiMethod) in METHOD_LOOK ? (method.toUpperCase() as ApiMethod) : "GET";
  const route = routeParts(path);
  const url = fullUrl(path, baseUrl);

  const code = (
    <code className={cn("font-mono text-[0.8125rem] leading-6 [overflow-wrap:anywhere]", deprecated && "line-through decoration-muted-foreground/60")}>
      {route.map((part, index) => (
        <span key={`${index}-${part.text}`} className={part.parameter ? "font-normal text-muted-foreground" : deprecated ? "font-medium text-muted-foreground" : "font-medium text-foreground"}>
          {breakable(part.text)}
        </span>
      ))}
    </code>
  );

  return (
    <div
      data-slot="api-endpoint"
      data-method={verb}
      data-deprecated={deprecated ? "true" : undefined}
      className={cn(
        "@container relative rounded-lg border border-border bg-card px-3.5 py-3 text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=api-endpoint-open]:focus-visible]:border-ring has-[[data-slot=api-endpoint-open]:focus-visible]:ring-[3px] has-[[data-slot=api-endpoint-open]:focus-visible]:ring-ring/40",
        href && "hover:border-foreground/30 hover:shadow-sm",
        className,
      )}
      {...props}
    >
      {/* The row lays itself out by its own width: beside a narrow sidebar the auth drops under the description, as it does on a phone. */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1.5 @lg:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
        <Badge variant="outline" className={cn("mt-0.5 w-16 justify-center rounded-md font-mono text-[0.6875rem] tracking-[0.04em]", METHOD_LOOK[verb])}>
          <span className="sr-only">HTTP </span>
          {verb}
        </Badge>

        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          {href ? (
            // The method sits in the badge, outside the link, so the link says it too: GET /v1/orders and POST /v1/orders are two links with two names.
            <a data-slot="api-endpoint-open" href={href} className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg after:content-['']">
              <span className="sr-only">{verb} </span>
              {code}
            </a>
          ) : (
            code
          )}
          {deprecated ? (
            <Badge variant="muted" className="gap-1">
              <IconWarning />
              {text.deprecated}
            </Badge>
          ) : null}
        </div>

        {description ? <p className="col-start-2 col-end-[-1] row-start-2 text-sm leading-5 text-muted-foreground [overflow-wrap:anywhere]">{description}</p> : null}

        {auth !== undefined ? (
          <p className="col-start-2 col-end-[-1] row-start-3 flex items-center gap-1.5 text-xs leading-5 text-muted-foreground @lg:col-start-3 @lg:col-end-4 @lg:row-start-1 @lg:mt-0.5">
            {auth === false ? <IconUnlock className="size-3.5 shrink-0" /> : <IconLock className="size-3.5 shrink-0" />}
            <span>
              <span className="sr-only">{text.authentication}: </span>
              {auth === false ? text.public : auth}
            </span>
          </p>
        ) : null}

        <CopyButton
          value={url}
          label={fill(text.copy, { method: verb, path })}
          copiedLabel={text.copied}
          iconOnly
          variant="ghost"
          size="sm"
          className="relative z-10 col-start-3 row-start-1 -mt-1 -mr-1.5 text-muted-foreground hover:text-foreground @lg:col-start-4"
        />
      </div>
    </div>
  );
}
