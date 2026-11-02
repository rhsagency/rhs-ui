import type { ComponentProps, ReactNode } from "react";

import { CopyField } from "@rhs-ui/application/copy-field";
import { IconArrowRight, IconBook, IconCheck, IconFlask, IconGitBranch, IconUsers } from "@rhs-ui/icons";
import { Badge, type BadgeProps } from "@rhs-ui/primitives/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

/** stable: supported by us and safe for production. beta: supported, but the API may still change. community: written and kept by others. */
export type SdkStatus = "stable" | "beta" | "community";

export interface Sdk {
  /** A stable id for the card. It keys the card, so it must be unique. */
  id: string;
  /** The language or framework: "TypeScript", "Python", "Laravel". */
  label: string;
  /** What to type to install it: "npm install @northwind/sdk". Real text, so it can be selected as well as copied. */
  install: string;
  /** The current release: "4.2.1". A leading "v" is ignored. */
  version: string;
  /** Who stands behind it. It is always written out as a word. */
  status: SdkStatus;
  /** The library's documentation. */
  docsHref: string;
  /** Its source code, usually a repository. */
  sourceHref: string;
  /** A glyph or logo for the language, drawn at 22px. Without one the card shows the first letters of the name. */
  mark?: ReactNode;
}

export interface SdkGridLabels {
  /** The word before the version number. */
  version: string;
  /** The status word of a stable library. */
  stable: string;
  /** The status word of a beta library. */
  beta: string;
  /** The status word of a library other people maintain. */
  community: string;
  /** The first link's text. */
  docs: string;
  /** The second link's text. */
  source: string;
  /** Read out after a link's text, so twelve "Docs" are not twelve identical words: "Docs for TypeScript". */
  forName: string;
  /** The accessible name of an install field's copy button. {name} stands for the language. */
  copyInstall: string;
  /** The community card's heading. */
  communityTitle: string;
  /** What the community card says about these libraries. It must not sound like an endorsement. */
  communityText: string;
  /** The community card's link. */
  communityLink: string;
}

export interface SdkGridProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Libraries". */
  eyebrow?: string;
  /** The heading: "Use it from your stack". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The official libraries, in the order you want them shown. */
  sdks: readonly Sdk[];
  /** A list of libraries other people maintain. It becomes a last card that says plainly they are not official; leave it out for no such card. */
  communityHref?: string;
  /** The level of the heading: 2 by default. The name on each card sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<SdkGridLabels>;
}

const LABELS: SdkGridLabels = {
  version: "Version",
  stable: "Stable",
  beta: "Beta",
  community: "Community",
  docs: "Docs",
  source: "Source",
  forName: "for",
  copyInstall: "Copy install command for {name}",
  communityTitle: "Community libraries",
  communityText: "Written and kept up by people outside our team, so they can lag behind the API. Read the repository before you depend on one.",
  communityLink: "Browse community libraries",
};

/** Each status has its own shape and its own fill, and always its word, so none of them depends on colour. */
const STATUS: Record<SdkStatus, { icon: typeof IconCheck; variant: NonNullable<BadgeProps["variant"]> }> = {
  stable: { icon: IconCheck, variant: "outline" },
  beta: { icon: IconFlask, variant: "secondary" },
  community: { icon: IconUsers, variant: "muted" },
};

/**
 * A command stays on one line beside its button while it fits. When it does not, the button drops under it, and a
 * command still too long for the card wraps instead of hiding its end behind a scrollbar. Its characters are never
 * joined into ligatures ("~>" stays "~>"): what is shown is exactly what is copied.
 */
const CODE = "[&>div]:flex-wrap [&>div]:justify-end [&_code]:flex-auto [&_code]:whitespace-normal [&_code]:[overflow-wrap:anywhere] [&_code]:[font-variant-ligatures:none]";

const LINK =
  "group/link inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** Two letters for a card with no mark: the capitals of "TypeScript" ("TS"), or the start of "Python" ("Py"). */
function monogram(label: string): string {
  const letters = Array.from(label).filter((char) => /\p{L}/u.test(char));
  if (letters.length <= 3) return letters.join("");
  const capitals = letters.filter((char) => char !== char.toLowerCase());
  return capitals.length >= 2 ? capitals.slice(0, 2).join("") : `${(letters[0] ?? "").toUpperCase()}${(letters[1] ?? "").toLowerCase()}`;
}

/**
 * The first question a developer asks of a product with an API: is there a
 * library for my stack? One card per language or framework, each with the name,
 * the current version, who stands behind it as a written word (Stable, Beta or
 * Community, each with its own shape so colour is never the only cue), the
 * install command in a copy field, and links to the docs and the source. The
 * command is real text you can select, and a copy button announces itself by
 * language, so a page of eight does not give a screen reader eight identical
 * buttons. A last, dashed card sends the reader to a list of community
 * libraries and says in words that those are not official, instead of padding
 * the grid with logos it does not stand behind. It needs no state of its own,
 * so it renders on the server; the copy buttons are the only client parts.
 */
export function SdkGrid({ eyebrow, title, description, sdks, communityHref, headingLevel = 2, labels: custom, className, ...props }: SdkGridProps) {
  const labels = { ...LABELS, ...custom };
  const Name = `h${headingLevel + 1}` as "h3" | "h4";

  return (
    <section data-slot="sdk-grid" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      <ul role="list" className="mt-10 grid gap-4 @3xl:mt-12 @2xl:grid-cols-2 @6xl:grid-cols-3">
        {sdks.map((sdk) => {
          const status = STATUS[sdk.status];
          const Icon = status.icon;
          return (
            <li key={sdk.id} className="flex min-w-0">
              <Card className="w-full min-w-0 gap-5 py-5">
                <CardHeader className="grid-rows-1 gap-0 px-5">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span
                      aria-hidden="true"
                      className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-background font-mono text-sm font-medium tracking-[-0.02em] [&_img]:size-[1.375rem] [&_svg]:size-[1.375rem]"
                    >
                      {sdk.mark ?? monogram(sdk.label)}
                    </span>
                    <div className="min-w-0">
                      <CardTitle asChild className="text-[1.0625rem] tracking-[-0.02em]">
                        <Name>{sdk.label}</Name>
                      </CardTitle>
                      <CardDescription className="mt-0.5 text-[0.8125rem] tabular-nums">
                        {labels.version} {sdk.version.replace(/^v/i, "")}
                      </CardDescription>
                    </div>
                  </div>
                  <CardAction className="row-span-1">
                    <Badge variant={status.variant} className="h-6 gap-1.5 px-2.5 text-[0.8125rem] [&>svg]:size-3.5">
                      <Icon aria-hidden="true" />
                      {labels[sdk.status]}
                    </Badge>
                  </CardAction>
                </CardHeader>

                <CardContent className="px-5">
                  {/* The field keeps a line under it for "Copied to clipboard." and the copy failure. That line is pulled up into the gap above the divider, so the command sits centred in its card and the message still fits without moving anything. */}
                  <CopyField value={sdk.install} label={labels.copyInstall.replace("{name}", sdk.label)} className={cn("[&>p]:-mb-5", CODE)} />
                </CardContent>

                <CardFooter className="mt-auto flex-wrap gap-x-6 gap-y-2 border-t border-border px-5 [.border-t]:pt-4">
                  <a href={sdk.docsHref} className={LINK}>
                    <IconBook aria-hidden="true" className="size-4 text-muted-foreground" />
                    <span>
                      {labels.docs}
                      <span className="sr-only">
                        {" "}
                        {labels.forName} {sdk.label}
                      </span>
                    </span>
                  </a>
                  <a href={sdk.sourceHref} className={LINK}>
                    <IconGitBranch aria-hidden="true" className="size-4 text-muted-foreground" />
                    <span>
                      {labels.source}
                      <span className="sr-only">
                        {" "}
                        {labels.forName} {sdk.label}
                      </span>
                    </span>
                  </a>
                </CardFooter>
              </Card>
            </li>
          );
        })}

        {communityHref ? (
          <li className="flex min-w-0">
            <Card className="w-full min-w-0 gap-5 border-dashed bg-muted/30 py-5 shadow-none">
              <CardHeader className="grid-rows-1 gap-0 px-5">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-lg border border-border bg-background">
                    <IconUsers size={22} />
                  </span>
                  <CardTitle asChild className="min-w-0 text-[1.0625rem] tracking-[-0.02em]">
                    <Name>{labels.communityTitle}</Name>
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-5">
                <p className="max-w-[46ch] text-sm leading-relaxed text-pretty text-muted-foreground">{labels.communityText}</p>
              </CardContent>
              <CardFooter className="mt-auto px-5">
                <a href={communityHref} className={LINK}>
                  {labels.communityLink}
                  <IconArrowRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-hover/link:translate-x-0.5 motion-reduce:transition-none" />
                </a>
              </CardFooter>
            </Card>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
