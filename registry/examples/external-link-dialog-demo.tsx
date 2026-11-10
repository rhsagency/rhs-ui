"use client";

import { useState, type MouseEvent, type ReactNode } from "react";

import { ExternalLinkDialog, ExternalLinkPanel } from "@rhs-ui/application/external-link-dialog";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";

// The look-alike has a Cyrillic "o" (U+043E) in its host, which is how a real one hides: written out, the address reads like Northwind's.
const LOOKALIKE = "https://n\u043erthwind.example/billing/update-card";
const HIDDEN_USER = "https://northwind.example@checkout-help.example/pay";
const DOCS = "https://docs.kestrel.dev/changelog?version=4.12&section=fixes";
const INSECURE = "http://events.halcyon.example:8080/live/stream";

const link = "font-medium text-foreground underline decoration-foreground/40 underline-offset-2 hover:decoration-foreground";

export default function Demo(): React.JSX.Element {
  const [trusted, setTrusted] = useState<readonly string[]>(["help.northwind.dev"]);
  const [opened, setOpened] = useState("Nothing opened yet.");

  // A link the dialog lets straight through (a trusted host) would take this page away from the preview. It is caught here, after the dialog
  // has decided, and said in words instead; a link the dialog asked about has been stopped already, and one on this page is left alone.
  // Only links in the thread count: the dialog itself is drawn elsewhere in the page, and its Continue must open its tab.
  function passedThrough(event: MouseEvent<HTMLElement>) {
    const anchor = (event.target as Element).closest("a[href]");
    if (!anchor || !event.currentTarget.contains(anchor) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const url = new URL(anchor.getAttribute("href") ?? "", window.location.href);
    if (url.origin === window.location.origin) return;
    event.preventDefault();
    setOpened(`${url.host} is trusted, so the link went straight through.`);
  }

  return (
    <div className="grid w-full gap-10">
      <Case caption="A thread of comments, written by other people. Every link that leaves the site asks first: click the first, then the second, whose host is not what it looks like. The help centre is trusted and just opens; so does the link to your own settings. Tick Don't ask again and the host moves to the trusted list.">
        <div onClick={passedThrough}>
          <ExternalLinkDialog
            intercept
            trustedHosts={trusted}
            onTrust={(host) => setTrusted((list) => (list.includes(host) ? list : [...list, host]))}
            onContinue={(href) => setOpened(`Continued to ${new URL(href).host}.`)}
            onCancel={() => setOpened("Went back.")}
          >
            <ul className="m-0 grid list-none divide-y divide-border overflow-hidden rounded-xl border border-border bg-card p-0 text-card-foreground shadow-xs">
              <Comment name="Mara Okafor" when="2 hours ago">
                The numbers behind the fix are in the{" "}
                <a href={DOCS} className={link}>
                  Kestrel changelog
                </a>
                , and the long version of what we found is on{" "}
                <a href="https://halcyon.example/notes/search-latency" className={link}>
                  halcyon.example/notes
                </a>
                .
              </Comment>
              <Comment name="A new account" when="1 hour ago">
                Your card on file has expired. Update it here before Friday:{" "}
                {/* The words say northwind.example; the address has a Cyrillic letter in it. */}
                <a href={LOOKALIKE} className={link}>
                  northwind.example/billing/update-card
                </a>
              </Comment>
              <Comment name="Leo Martins" when="12 minutes ago">
                The export guide lives in the{" "}
                <a href="https://help.northwind.dev/exports" className={link}>
                  help centre
                </a>
                , and your own{" "}
                <a href="#export-settings" className={link}>
                  export settings
                </a>{" "}
                are one click away.
              </Comment>
            </ul>
          </ExternalLinkDialog>
        </div>
        <div className="grid gap-1 text-xs text-muted-foreground">
          <p aria-live="polite">{opened}</p>
          <p>
            Trusted by you: <span className="font-mono text-foreground">{trusted.join(", ")}</span>
          </p>
        </div>
      </Case>

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
        <Case caption="An ordinary link. The host is in bold so a long address cannot hide it, and Go back has focus.">
          <Surface>
            <ExternalLinkPanel standalone href={DOCS} onTrust={() => undefined} />
          </Surface>
        </Case>
        <Case caption="A look-alike. The host is shown in its ASCII form, the one the browser will really ask for, under a warning, and Continue is no longer the quiet option.">
          <Surface>
            <ExternalLinkPanel standalone href={LOOKALIKE} onTrust={() => undefined} />
          </Surface>
        </Case>
        <Case caption="A name in front of the host. Everything before the @ is a user name, not the site.">
          <Surface>
            <ExternalLinkPanel standalone href={HIDDEN_USER} />
          </Surface>
        </Case>
        <Case caption="No secure connection, and a port: both are said, in a quiet line, without a warning.">
          <Surface>
            <ExternalLinkPanel standalone href={INSECURE} onTrust={() => undefined} />
          </Surface>
        </Case>
      </div>
    </div>
  );
}

function Comment({ name, when, children }: { name: string; when: string; children: ReactNode }): React.JSX.Element {
  return (
    <li className="flex items-start gap-3 px-4 py-3.5 sm:px-5">
      <Avatar aria-hidden="true" size="sm">
        <AvatarFallback>{name.split(" ").map((word) => word[0]).join("").slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="grid min-w-0 gap-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">{when}</span>
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">{children}</p>
      </div>
    </li>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The dialog a panel sits in, drawn flat so the panel is seen in its place. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm">{children}</div>;
}
