"use client";

import { useState, type ReactNode } from "react";

import { IconMenu } from "@rhs-ui/icons";
import { SmartAppBanner } from "@rhs-ui/marketing/smart-app-banner";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** A drawn app icon for the preview: a compass in a dark tile. In a real banner this is your own icon. */
function AtlasIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="bg-foreground text-background">
      <circle cx="24" cy="24" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M30.5 17.5L26.8 26.8 17.5 30.5 21.2 21.2z" fill="currentColor" />
    </svg>
  );
}

function Phone({ caption, children, className }: { caption: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <figure className={cn("grid grid-cols-1 gap-4", className)}>
      <div className="mx-auto w-full max-w-[24.5rem] sm:rounded-[2.5rem] sm:border sm:border-border sm:bg-muted sm:p-2.5">
        <div className="h-[24rem] overflow-hidden rounded-2xl border border-border bg-background sm:rounded-[2rem]">
          {children}
          <div className="flex h-14 items-center justify-between px-5">
            <span className="text-base font-semibold tracking-tight">Atlas</span>
            <IconMenu aria-hidden="true" className="size-5 text-muted-foreground" />
          </div>
          <div className="grid gap-3 px-5 pt-4">
            <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">Plan the trip</p>
            <p className="text-3xl leading-[1.05] font-medium tracking-[-0.04em] text-balance">Every map you need, with no signal at all.</p>
            <div className="mt-2 h-24 rounded-xl bg-muted" />
          </div>
        </div>
      </div>
      <figcaption className="mx-auto max-w-[24.5rem] text-center text-xs leading-relaxed text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  const [round, setRound] = useState(0);
  const [note, setNote] = useState("");

  return (
    <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-8 sm:px-6">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Shown on every width here; on a real page it appears below 640px unless you say otherwise. The button reads Get, or Open once you know the app is installed, and closing hands the choice back to you.
      </p>
      {/* Side by side only from 1024px, where each phone is wide enough for the Open banner to keep its rating on one line. */}
      <div className="grid grid-cols-1 gap-x-10 gap-y-12 lg:grid-cols-2">
        <Phone caption="Not installed: Get goes to the store page.">
          <SmartAppBanner
            key={`get-${round}`}
            showOn="all"
            labels={{ banner: "Get the app, not installed" }}
            name="Atlas"
            pitch="Offline maps and trip notes"
            icon={<AtlasIcon />}
            rating={4.8}
            ratingCount={12400}
            storeHref="#app-store"
            onAction={(action) => setNote(`onAction("${action}"): the store page opens.`)}
            onDismiss={() => setNote("onDismiss: store today's date, and keep the banner away for thirty days.")}
          />
        </Phone>
        <Phone caption="Installed: Open goes to a deep link into the app.">
          <SmartAppBanner
            key={`open-${round}`}
            showOn="all"
            labels={{ banner: "Open the app, installed" }}
            name="Atlas"
            pitch="Offline maps and trip notes"
            icon={<AtlasIcon />}
            rating={4.8}
            ratingCount={12400}
            installed
            storeHref="#app-store"
            openHref="#atlas-home"
            onAction={(action) => setNote(`onAction("${action}"): the app opens at atlas://home.`)}
            onDismiss={() => setNote("onDismiss: store today's date, and keep the banner away for thirty days.")}
          />
        </Phone>
        <Phone caption="No icon and no rating: a monogram of the name is drawn, and the rating line is left out." className="lg:col-span-2">
          <SmartAppBanner
            key={`bare-${round}`}
            showOn="all"
            labels={{ banner: "Get the app, no icon and no rating" }}
            name="Atlas"
            pitch="Offline maps and trip notes"
            storeHref="#app-store"
            onAction={(action) => setNote(`onAction("${action}"): the store page opens.`)}
            onDismiss={() => setNote("onDismiss: store today's date, and keep the banner away for thirty days.")}
          />
        </Phone>
      </div>
      <div className="grid grid-cols-1 justify-items-center gap-3">
        <p className="min-h-5 text-center text-xs text-muted-foreground" role="status">
          {note}
        </p>
        {note ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNote("");
              setRound((n) => n + 1);
            }}
          >
            Show the banners again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
