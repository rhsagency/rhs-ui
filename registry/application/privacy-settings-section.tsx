"use client";

import { useId, useRef, useState, type ReactNode } from "react";

import { IconAlertCircle, IconArrowUpRight, IconCheckCircle, IconGlobe, IconLock, IconUsers } from "@rhs-ui/icons";
import { Callout } from "@rhs-ui/primitives/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { RadioCards } from "@rhs-ui/primitives/radio-cards";
import { SettingsRow } from "@rhs-ui/primitives/settings-row";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export type ProfileVisibility = "public" | "members" | "private";

export interface PrivacySettings {
  /** Who can open the profile page. */
  visibility: ProfileVisibility;
  /** Show recent edits, comments and publications on the profile. */
  showActivity: boolean;
  /** Let search engines list the profile (public profiles only). */
  searchEngines: boolean;
  /** Share anonymous product usage with the team. */
  shareUsage: boolean;
}

export interface PrivacySettingsSectionProps {
  /** The current settings. Controlled: update it in onChange. */
  value: PrivacySettings;
  /** Called for every change, at once; there is no save button. May return a promise: the status line says Saving and then confirms or fails. */
  onChange: (next: PrivacySettings) => void | Promise<void>;
  /** Where the privacy policy lives. */
  policyHref: string;
  title?: string;
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  className?: string;
}

type Status = { kind: "idle" | "saving" | "saved" | "error"; text: string };

const VISIBILITY: readonly { value: ProfileVisibility; title: string; description: string; icon: ReactNode; said: string }[] = [
  { value: "public", title: "Public", description: "Anyone with the link can open your profile, signed in or not.", icon: <IconGlobe />, said: "Your profile is now public." },
  { value: "members", title: "Members only", description: "Only people who are signed in to an account can open your profile.", icon: <IconUsers />, said: "Your profile is now visible to members only." },
  { value: "private", title: "Only me", description: "Nobody else can open your profile page.", icon: <IconLock />, said: "Your profile is now visible only to you." },
];

const SWITCHES = [
  {
    key: "showActivity",
    label: "Show my activity",
    on: "People who can open your profile see what you edited, commented on and published lately.",
    off: "Your recent edits and comments stay hidden. Others only see your name, picture and bio.",
    saidOn: "Your activity is now shown on your profile.",
    saidOff: "Your activity is now hidden from your profile.",
  },
  {
    key: "searchEngines",
    label: "Appear in search engines",
    on: "Search engines may list your profile page in their results.",
    off: "Your page asks search engines not to list it. Results that already exist can take weeks to fade.",
    saidOn: "Search engines may now list your profile.",
    saidOff: "Search engines are now asked not to list your profile.",
  },
  {
    key: "shareUsage",
    label: "Share usage data to improve the product",
    on: "We see which features you open, never what you write or upload. It helps us decide what to fix next.",
    off: "Nothing about how you use the product is shared with us. Fixes may reach you a little later.",
    saidOn: "Usage data sharing is now on.",
    saidOff: "Usage data sharing is now off.",
  },
] as const;

/**
 * Privacy controls that explain themselves: who can see the profile as three
 * choice cards, then a switch each for activity, search engines and usage
 * data, with a line that says what the current state means for other people.
 * Every change applies at once and is confirmed in a polite status line;
 * choosing "Only me" adds a note about work that is still shared with others.
 */
export function PrivacySettingsSection({
  value,
  onChange,
  policyHref,
  title = "Privacy",
  description = "Choose who can see your profile and what you share. Every change applies at once.",
  headingLevel = 2,
  className,
}: PrivacySettingsSectionProps) {
  const id = useId();
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const ticket = useRef(0);
  const [status, setStatus] = useState<Status>({ kind: "idle", text: "Changes save as you make them." });

  async function apply(next: PrivacySettings, said: string) {
    const mine = ++ticket.current;
    setStatus({ kind: "saving", text: "Saving…" });
    try {
      await onChange(next);
      if (mine === ticket.current) setStatus({ kind: "saved", text: said });
    } catch {
      if (mine === ticket.current) setStatus({ kind: "error", text: "Could not save that change. Try again." });
    }
  }

  // What a switch cannot do while the profile is closed, said next to the switch.
  const notes: Partial<Record<(typeof SWITCHES)[number]["key"], string>> = {
    showActivity: value.visibility === "private" ? "Nobody else can open your profile right now, so this changes nothing yet." : undefined,
    searchEngines: value.visibility === "public" ? undefined : `Only public profiles are listed, so this has no effect while your profile is ${value.visibility === "members" ? "for members only" : "only yours"}.`,
  };

  return (
    <Card data-slot="privacy-settings-section" role="group" aria-labelledby={`${id}-title`} className={cn("@container gap-0 pb-0", className)}>
      <CardHeader className="pb-6">
        <CardTitle asChild>
          <Heading id={`${id}-title`} className="text-base">{title}</Heading>
        </CardTitle>
        <CardDescription className="text-pretty">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <p className="mb-3 text-sm font-medium">Profile visibility</p>
        <RadioCards
          label="Profile visibility"
          value={value.visibility}
          onValueChange={(next) => {
            const chosen = VISIBILITY.find((option) => option.value === next);
            if (chosen) void apply({ ...value, visibility: chosen.value }, chosen.said);
          }}
          options={VISIBILITY.map(({ value: optionValue, title: optionTitle, description: optionDescription, icon }) => ({ value: optionValue, title: optionTitle, description: optionDescription, icon }))}
        />
        {value.visibility === "private" ? (
          <Callout tone="note" title="Only you can open your profile" className="mt-3 motion-safe:animate-rhs-in">
            Teammates can still open work you have shared with them, and workspace admins can see your name and email.
          </Callout>
        ) : null}
      </CardContent>
      <div className="divide-y divide-border border-t border-border px-6">
        {SWITCHES.map((item) => {
          const on = value[item.key];
          const switchId = `${id}-${item.key}`;
          return (
            <SettingsRow
              key={item.key}
              label={item.label}
              htmlFor={switchId}
              className="grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8"
              description={
                <span id={`${switchId}-description`}>
                  {on ? item.on : item.off}
                  {notes[item.key] ? <span className="mt-1 block text-xs">{notes[item.key]}</span> : null}
                </span>
              }
            >
              <Switch
                id={switchId}
                checked={on}
                aria-describedby={`${switchId}-description`}
                onCheckedChange={(next) => void apply({ ...value, [item.key]: next }, next ? item.saidOn : item.saidOff)}
              />
            </SettingsRow>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-b-xl border-t border-border bg-muted/40 px-6 py-3.5">
        <p role="status" aria-live="polite" className={cn("flex items-center gap-2 text-sm", status.kind === "error" ? "font-medium text-destructive" : "text-muted-foreground")}>
          {status.kind === "saved" ? <IconCheckCircle className="size-4 shrink-0 text-foreground" /> : null}
          {status.kind === "error" ? <IconAlertCircle className="size-4 shrink-0" /> : null}
          <span>{status.text}</span>
        </p>
        <a
          href={policyHref}
          className="inline-flex items-center gap-1 rounded-md text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          Read the privacy policy
          <IconArrowUpRight className="size-3.5" />
        </a>
      </div>
    </Card>
  );
}
