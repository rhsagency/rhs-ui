"use client";

import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { ChatHeader, type ChatHeaderAction, type ChatMember, type ChatPresence } from "@rhs-ui/application/chat-header";
import { IconInfo, IconPhone, IconSearch, IconVideo } from "@rhs-ui/icons";

// A fixed "now" keeps "Last seen 14:02" the same on every load. In an app, leave `now` out and the bar reads the browser's clock.
const NOW = Date.parse("2026-10-26T15:30:00Z");

// Drawn portraits as data URIs, so the preview needs no image host.
const portrait = (background: string, figure: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${background}"/><circle cx="48" cy="38" r="17" fill="${figure}"/><path d="M14 96c4-22 18-33 34-33s30 11 34 33z" fill="${figure}"/></svg>`);

const ANNA = portrait("#d9d6cf", "#3a3733");
const MEMBERS: readonly ChatMember[] = [{ name: "Anna de Vries" }, { name: "Tom Brandt" }, { name: "Mia Jansen" }, { name: "Jonas Keller" }];

const PRESENCE = {
  online: { label: "Active", presence: { state: "online" } },
  away: { label: "Away", presence: { state: "away" } },
  offline: { label: "Offline", presence: { state: "offline", lastSeenAt: "2026-10-26T15:12:00Z" } },
} satisfies Record<string, { label: string; presence: ChatPresence }>;

type Who = keyof typeof PRESENCE;
const OPTIONS = (Object.keys(PRESENCE) as Who[]).map((value) => ({ value, label: PRESENCE[value].label }));

function Frame({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid gap-2">
      <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">{children}</div>
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  const [who, setWho] = useState<Who>("online");
  const [did, setDid] = useState("");

  const actions = (name: string): ChatHeaderAction[] => [
    { id: "voice", label: "Voice call", icon: <IconPhone />, onSelect: () => setDid(`Calling ${name}.`) },
    { id: "video", label: "Video call", icon: <IconVideo />, onSelect: () => setDid(`Starting a video call with ${name}.`) },
    { id: "search", label: "Search in conversation", icon: <IconSearch />, onSelect: () => setDid(`Searching the conversation with ${name}.`) },
    { id: "info", label: "Conversation info", icon: <IconInfo />, onSelect: () => setDid(`Opening the info for ${name}.`) },
  ];

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-7">
      <div className="grid gap-3">
        <Frame caption="A direct chat. The line under the name follows presence.">
          <ChatHeader
            conversation={{ id: "anna", name: "Anna de Vries", image: ANNA }}
            presence={PRESENCE[who].presence}
            actions={actions("Anna de Vries")}
            onOpenInfo={() => setDid("Opening the info for Anna de Vries.")}
            now={NOW}
            locale="en-GB"
          />
        </Frame>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs text-muted-foreground">Anna is</span>
          <SegmentedControl label="Anna's presence" options={OPTIONS} value={who} onValueChange={(value) => setWho(value as Who)} />
        </div>
      </div>

      <Frame caption="Offline with a last-seen time, and muted: a bell with a line through it and the word.">
        <ChatHeader
          conversation={{ id: "tom", name: "Tom Brandt", muted: true }}
          presence={{ state: "offline", lastSeenAt: "2026-10-26T14:02:00Z" }}
          actions={actions("Tom Brandt")}
          onOpenInfo={() => setDid("Opening the info for Tom Brandt.")}
          now={NOW}
          locale="en-GB"
        />
      </Frame>

      <Frame caption="A group: a mosaic of faces, the member count and who is online.">
        <ChatHeader
          conversation={{ id: "checkout", name: "Checkout redesign", group: true, members: MEMBERS, memberCount: 12, onlineCount: 3 }}
          actions={actions("Checkout redesign").slice(1)}
          onOpenInfo={() => setDid("Opening the info for Checkout redesign.")}
          now={NOW}
          locale="en-GB"
        />
      </Frame>

      <div className="grid gap-2">
        <p className="text-xs text-muted-foreground">On a phone the back button appears, the long name truncates and the extra actions wait in a menu.</p>
        <div className="w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <ChatHeader
            conversation={{ id: "dsys", name: "Northwind design system working group", group: true, members: MEMBERS, memberCount: 31, onlineCount: 8 }}
            actions={actions("the working group")}
            onBack={() => setDid("Back to the list of conversations.")}
            onOpenInfo={() => setDid("Opening the info for the working group.")}
            now={NOW}
            locale="en-GB"
          />
        </div>
      </div>

      <p aria-live="polite" className="min-h-5 text-center text-xs text-muted-foreground">
        {did || "Press an action, open the info, or change Anna's presence and wait a moment: the change is announced once it has held."}
      </p>
    </div>
  );
}
