"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconExternal, IconShieldAlert, IconWarning } from "@rhs-ui/icons";
import { analyseLink, DEFAULT_LABELS, type ExternalLinkLabels } from "@rhs-ui/application/external-link-dialog/link";
import { AlertDialogAction, AlertDialogCancel, AlertDialogDescription, AlertDialogTitle } from "@rhs-ui/primitives/alert-dialog";
import { Button, buttonVariants } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export interface ExternalLinkPanelProps extends Omit<ComponentProps<"div">, "children"> {
  /** The address the link leads to, as it was written. Anything that is not an http or https address gets a message and no Continue button. */
  href: string;
  /** Draw the panel on its own (a page, a sheet, a preview) instead of inside an AlertDialog. The title and the buttons are then plain elements. */
  standalone?: boolean;
  /** Continue was chosen. The link itself opens in a new tab; this is for counting it. */
  onContinue?: (href: string) => void;
  /** Go back was chosen. Inside a dialog the dialog reports it. */
  onCancel?: () => void;
  /** Shows "Don't ask again for this site" and calls this with the host when Continue is chosen with the box ticked. How the host is remembered is up to you. */
  onTrust?: (host: string) => void;
  /** The words the panel says, for translation. */
  labels?: ExternalLinkLabels;
}

/** The title and the line under it: Radix names the dialog from them when the panel is in one, and plain elements stand in when it is not. */
function Heading({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <h2 className={className}>{children}</h2> : <AlertDialogTitle className={className}>{children}</AlertDialogTitle>;
}

function Lede({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <p className={className}>{children}</p> : <AlertDialogDescription className={className}>{children}</AlertDialogDescription>;
}

/** A warning: what is wrong, and then the real host on a line of its own in code type, so a long name is not mistaken for the words around it. */
function Warning({ title, body, host }: { title: string; body: string; host: string }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/5 px-3.5 py-3">
      <IconShieldAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div className="grid min-w-0 gap-1.5 text-sm">
        {/* The destructive colour a little darker, so it holds 4.5:1 on its own tinted background. */}
        <p className="font-medium text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]">{title}</p>
        <p className="leading-relaxed text-muted-foreground">{body}</p>
        <code className="block rounded-md bg-background px-2.5 py-1.5 font-mono text-[0.8125rem] font-medium break-all text-foreground">{host}</code>
      </div>
    </div>
  );
}

/**
 * The question behind an external link: where it really goes, with the host in bold so a long address cannot hide it,
 * the words "This link goes to another website", and the two answers, Go back (which has focus) and Continue. An address
 * built to mislead gets a warning in words: a host with look-alike letters is shown as the ASCII name the browser will
 * really ask for, and a user name in front of the host is called out. Continue is a real link that opens a new tab with
 * `noopener noreferrer`. Use it inside an AlertDialog, or with `standalone` anywhere else.
 */
export function ExternalLinkPanel({ href, standalone = false, onContinue, onCancel, onTrust, labels, className, ...props }: ExternalLinkPanelProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const [trust, setTrust] = useState(false);
  const info = analyseLink(href);
  const warned = info !== null && (info.lookalike || info.hasCredentials);
  const variant = warned ? "destructive" : "default";

  const link = info ? (
    <a
      href={info.href}
      target="_blank"
      rel="noopener noreferrer"
      className={standalone ? buttonVariants({ variant }) : undefined}
      onClick={() => {
        if (trust) onTrust?.(info.host);
        onContinue?.(info.href);
      }}
    >
      {words.continue}
      <span className="sr-only"> {words.newTab}</span>
    </a>
  ) : null;

  return (
    <div data-slot="external-link-panel" data-warned={warned || undefined} className={cn("grid gap-5 p-6", className)} {...props}>
      <div className="flex items-start gap-3.5">
        <span
          aria-hidden="true"
          className={cn("grid size-10 shrink-0 place-items-center rounded-xl border [&_svg]:size-[1.125rem]", warned || !info ? "border-destructive/40 bg-destructive/5 text-destructive" : "border-border bg-muted text-foreground")}
        >
          {warned || !info ? <IconShieldAlert /> : <IconExternal />}
        </span>
        <div className="grid min-w-0 gap-1 pt-px">
          <Heading standalone={standalone} className="text-lg leading-tight font-semibold tracking-[-0.02em]">
            {info ? words.title : words.invalidTitle}
          </Heading>
          <Lede standalone={standalone} className="text-sm leading-relaxed text-muted-foreground">
            {info ? words.description : words.invalidBody}
          </Lede>
        </div>
      </div>

      {info ? (
        <dl className="grid gap-1.5">
          <dt className="text-xs font-medium text-muted-foreground">{words.destination}</dt>
          <dd className="relative m-0 max-h-32 overflow-y-auto rounded-lg border border-border bg-muted/40 px-3.5 py-3 font-mono text-[0.8125rem] leading-relaxed [overflow-wrap:anywhere]">
            <span className="text-muted-foreground">
              {info.secure ? "https://" : "http://"}
              {info.credentials}
            </span>
            <strong className="font-semibold text-foreground">{info.lookalike ? info.written : info.host}</strong>
            <span className="text-muted-foreground">
              {info.port}
              {info.rest}
            </span>
          </dd>
          {!info.secure ? (
            <dd className="m-0 flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconWarning aria-hidden="true" className="size-3.5 shrink-0" />
              {words.insecure}
            </dd>
          ) : null}
        </dl>
      ) : null}

      {info?.lookalike ? <Warning title={words.lookalikeTitle} body={words.lookalikeBody} host={info.host} /> : null}

      {info?.hasCredentials ? <Warning title={words.credentialsTitle} body={words.credentialsBody} host={info.host} /> : null}

      {/* A host that is built to mislead is never offered for trust: the box is only for sites that are what they say. */}
      {info && onTrust && !warned ? (
        <div className="flex items-center gap-2.5">
          <Checkbox id={`${id}-trust`} checked={trust} onCheckedChange={(next) => setTrust(next === true)} />
          <Label htmlFor={`${id}-trust`} className="font-normal">
            {words.trust}
          </Label>
        </div>
      ) : null}

      {/* Stacked on a phone the main answer comes first, except when the link is suspect: then the safe one does. */}
      <div className={cn("flex gap-2 sm:flex-row sm:justify-end", warned ? "flex-col" : "flex-col-reverse")}>
        {standalone ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            {words.cancel}
          </Button>
        ) : (
          <AlertDialogCancel>{words.cancel}</AlertDialogCancel>
        )}
        {link && !standalone ? (
          <AlertDialogAction asChild variant={variant}>
            {link}
          </AlertDialogAction>
        ) : (
          link
        )}
      </div>
    </div>
  );
}
