"use client";

import { useEffect, useId, useRef, useState } from "react";

import { IconAlertCircle, IconArrowUpRight, IconCheckCircle, IconClose, IconEye, IconPlus, IconSpinner, IconUser, IconXCircle } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { FileTrigger } from "@rhs-ui/primitives/file-trigger";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Label } from "@rhs-ui/primitives/label";
import { TextareaCounter } from "@rhs-ui/primitives/textarea-counter";
import { USERNAME_RULE, displayUrl, normalizeUrl, usernameProblem, type ProfileLink, type PublicProfile } from "@rhs-ui/application/public-profile-section/profile";
import { cn } from "@/lib/utils";

export type { ProfileLink, PublicProfile } from "@rhs-ui/application/public-profile-section/profile";

export interface PublicProfileSectionProps {
  /** The saved profile. The draft lives inside until Save; pass the new profile back after onSave. */
  profile: PublicProfile;
  /**
   * Called with the cleaned-up draft when Save is pressed. When a new picture was chosen it comes as the
   * second argument: upload it and store the address you get back (profile.avatar of a new picture is only
   * a temporary preview address). May return a promise; the button shows it is working.
   */
  onSave: (profile: PublicProfile, avatarFile: File | null) => void | Promise<void>;
  /** Is this username free? Resolve true for yes. Only asked for names that follow the rules and differ from the saved one. */
  onCheckUsername?: (username: string) => boolean | Promise<boolean>;
  /** Most links a profile may carry. */
  maxLinks?: number;
  /** Most characters in the bio. */
  bioLimit?: number;
  /** Largest picture in bytes. */
  maxPictureSize?: number;
  /** Locale for the picture size in the refusal message. */
  locale?: string;
  title?: string;
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  className?: string;
}

interface Draft {
  avatar: string | null;
  displayName: string;
  username: string;
  bio: string;
  links: ProfileLink[];
}

type Availability = { name: string; state: "checking" | "available" | "taken" | "error" };

const toDraft = (profile: PublicProfile): Draft => ({
  avatar: profile.avatar,
  displayName: profile.displayName,
  username: profile.username,
  bio: profile.bio,
  links: profile.links.map((link) => ({ ...link })),
});

/** The draft as it will be saved: trimmed, empty link rows dropped, addresses given their scheme. */
const tidy = (draft: Draft): PublicProfile => ({
  avatar: draft.avatar,
  displayName: draft.displayName.trim(),
  username: draft.username,
  bio: draft.bio.trim(),
  links: draft.links
    .filter((link) => link.url.trim() || link.label.trim())
    .map((link) => ({ id: link.id, label: link.label.trim(), url: normalizeUrl(link.url) ?? link.url.trim() })),
});

const linkProblem = (link: ProfileLink): string | null => {
  if (link.url.trim() && normalizeUrl(link.url) === null) return "Enter a web address like https://example.com";
  if (link.label.trim() && !link.url.trim()) return "Add the address this link goes to";
  return null;
};

/**
 * The form for how others see you, with the result beside it: a picture
 * (choose, change, remove), a display name, a @username with its rules in
 * words and an availability hint that is announced politely, a bio with a
 * counter, and up to five labelled links. The preview card mirrors the draft
 * exactly as visitors will see it, so people watch their page change as they
 * type. Save lights up only when the draft differs and is valid, Discard
 * restores the saved values, and a saved line confirms.
 */
export function PublicProfileSection({
  profile,
  onSave,
  onCheckUsername,
  maxLinks = 5,
  bioLimit = 160,
  maxPictureSize = 2_000_000,
  locale = "en-GB",
  title = "Public profile",
  description = "This is what people see when they open your page. The preview follows every change you make.",
  headingLevel = 2,
  className,
}: PublicProfileSectionProps) {
  const id = useId();
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const incoming = JSON.stringify(profile);
  const [seen, setSeen] = useState(incoming);
  const [baseline, setBaseline] = useState<Draft>(() => toDraft(profile));
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile));
  const [file, setFile] = useState<File | null>(null);
  const [epoch, setEpoch] = useState(0);
  const [touched, setTouched] = useState<Record<string, true>>({});
  const [phase, setPhase] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const pending = useRef<string | null>(null);
  const counter = useRef(0);
  const checker = useRef(onCheckUsername);
  const list = useRef<HTMLUListElement>(null);
  const addLinkButton = useRef<HTMLButtonElement>(null);
  const focusLink = useRef<string | null>(null);
  const saveButton = useRef<HTMLButtonElement>(null);
  const statusLine = useRef<HTMLParagraphElement>(null);
  const focusAfterSave = useRef<"save" | "status" | null>(null);

  // A new saved profile from outside replaces the draft.
  if (incoming !== seen) {
    setSeen(incoming);
    setBaseline(toDraft(profile));
    setDraft(toDraft(profile));
    setFile(null);
    setEpoch((count) => count + 1);
  }

  useEffect(() => {
    checker.current = onCheckUsername;
  });
  useEffect(
    () => () => {
      if (pending.current) URL.revokeObjectURL(pending.current);
    },
    [],
  );
  useEffect(() => {
    const target = focusLink.current;
    if (!target) return;
    focusLink.current = null;
    list.current?.querySelector<HTMLInputElement>(`[data-link="${CSS.escape(target)}"] input`)?.focus();
  });
  // Save disables itself while it works and again once nothing is left to save, which drops its focus: hand it on.
  useEffect(() => {
    if (phase !== "saved" && phase !== "error") return;
    const target = focusAfterSave.current;
    focusAfterSave.current = null;
    (target === "save" ? saveButton.current : target === "status" ? statusLine.current : null)?.focus();
  }, [phase]);

  const nameProblem = draft.displayName.trim() ? null : "Add a display name";
  const userProblem = usernameProblem(draft.username);
  const unchangedName = draft.username.toLowerCase() === baseline.username.toLowerCase();

  useEffect(() => {
    const ask = checker.current;
    if (!ask || userProblem || unchangedName) {
      setAvailability(null);
      return;
    }
    const name = draft.username;
    setAvailability({ name, state: "checking" });
    let live = true;
    const timer = window.setTimeout(async () => {
      try {
        const free = await ask(name);
        if (live) setAvailability({ name, state: free ? "available" : "taken" });
      } catch {
        if (live) setAvailability({ name, state: "error" });
      }
    }, 400);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [draft.username, userProblem, unchangedName]);

  const status = availability && availability.name === draft.username ? availability.state : null;
  const linkProblems = draft.links.map(linkProblem);
  const invalid = Boolean(nameProblem || userProblem || linkProblems.some(Boolean) || status === "checking" || status === "taken");
  const dirty = file !== null || JSON.stringify(tidy(draft)) !== JSON.stringify(tidy(baseline));
  const shown = tidy(draft);
  const shownLinks = shown.links.filter((link) => normalizeUrl(link.url));

  const edit = (patch: Partial<Draft>) => {
    setDraft((current) => ({ ...current, ...patch }));
    setPhase("idle");
  };
  const editLink = (linkId: string, patch: Partial<ProfileLink>) => {
    setDraft((current) => ({ ...current, links: current.links.map((link) => (link.id === linkId ? { ...link, ...patch } : link)) }));
    setPhase("idle");
  };
  const touch = (key: string) => setTouched((current) => (current[key] ? current : { ...current, [key]: true }));

  function choosePicture(next: File | null) {
    if (pending.current) URL.revokeObjectURL(pending.current);
    pending.current = next ? URL.createObjectURL(next) : null;
    setFile(next);
    edit({ avatar: pending.current ?? baseline.avatar });
  }

  function addLink() {
    const linkId = `new-${++counter.current}`;
    focusLink.current = linkId;
    edit({ links: [...draft.links, { id: linkId, label: "", url: "" }] });
  }

  function removeLink(linkId: string) {
    edit({ links: draft.links.filter((link) => link.id !== linkId) });
    requestAnimationFrame(() => addLinkButton.current?.focus());
  }

  function discard() {
    if (pending.current) URL.revokeObjectURL(pending.current);
    pending.current = null;
    setDraft(toDraft(tidy(baseline)));
    setFile(null);
    setTouched({});
    setEpoch((count) => count + 1);
    setPhase("idle");
  }

  async function save() {
    if (!dirty || invalid || phase === "saving") return;
    const next = tidy(draft);
    const hadFocus = document.activeElement === saveButton.current;
    setPhase("saving");
    try {
      await onSave(next, file);
      // What was saved is the new starting point; anything typed while it saved stays a pending change.
      pending.current = null;
      setBaseline(toDraft(next));
      setFile(null);
      setEpoch((count) => count + 1);
      if (hadFocus) focusAfterSave.current = "status";
      setPhase("saved");
    } catch {
      if (hadFocus) focusAfterSave.current = "save";
      setPhase("error");
    }
  }

  return (
    <Card data-slot="public-profile-section" role="group" aria-labelledby={`${id}-title`} className={cn("@container gap-0 pb-0", className)}>
      <CardHeader className="pb-6">
        <CardTitle asChild>
          <Heading id={`${id}-title`} className="text-base">{title}</Heading>
        </CardTitle>
        <CardDescription className="text-pretty">{description}</CardDescription>
      </CardHeader>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className="grid grid-cols-1 gap-8 border-t border-border px-6 py-6 @3xl:grid-cols-[minmax(0,1fr)_19rem]">
          {/* Its own container, so the link rows read the width of this column and not of the whole card. */}
          <div className="@container grid grid-cols-1 content-start gap-6">
            <div className="flex items-center gap-4">
              <Avatar size="lg" className="data-[size=lg]:size-16">
                {draft.avatar ? <AvatarImage src={draft.avatar} alt="" /> : null}
                <AvatarFallback className="text-lg group-data-[size=lg]/avatar:text-lg">{initialsOf(draft.displayName) || <IconUser className="size-6" />}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                {/* FileTrigger is a grid with an auto track: left alone, a long file name (or its refusal message) widens the row past the screen instead of truncating. */}
                <FileTrigger
                  key={epoch}
                  className="grid-cols-[minmax(0,1fr)] [&>p]:[overflow-wrap:anywhere]"
                  accept="image/png,image/jpeg,image/webp"
                  maxSize={maxPictureSize}
                  locale={locale}
                  label={draft.avatar ? "Change picture" : "Upload a picture"}
                  onFileChange={choosePicture}
                />
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span>PNG, JPG or WebP, up to {Math.round(maxPictureSize / 1e6)}&nbsp;MB.</span>
                  {draft.avatar && !file ? (
                    <button
                      type="button"
                      onClick={() => edit({ avatar: null })}
                      className="rounded font-medium text-foreground underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    >
                      Remove picture
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
            <FormField error={touched.name ? nameProblem : null}>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input value={draft.displayName} maxLength={50} autoComplete="name" onBlur={() => touch("name")} onChange={(event) => edit({ displayName: event.target.value })} />
              </FormControl>
            </FormField>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <Label htmlFor={`${id}-username`}>Username</Label>
                <p role="status" aria-live="polite" className="flex min-h-5 items-center gap-1.5 text-xs font-medium">
                  {userProblem && draft.username ? (
                    <span className="flex items-center gap-1.5 text-destructive">
                      <IconAlertCircle className="size-3.5 shrink-0" />
                      {userProblem}
                    </span>
                  ) : status === "checking" ? (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <IconSpinner className="size-3.5 shrink-0" />
                      Checking
                    </span>
                  ) : status === "available" ? (
                    <span className="flex items-center gap-1.5">
                      <IconCheckCircle className="size-3.5 shrink-0" />
                      <span className="sr-only">{draft.username} is </span>Available
                    </span>
                  ) : status === "taken" ? (
                    <span className="flex items-center gap-1.5 text-destructive">
                      <IconXCircle className="size-3.5 shrink-0" />
                      <span className="sr-only">{draft.username} is </span>Taken
                    </span>
                  ) : status === "error" ? (
                    <span className="text-muted-foreground">Could not check right now</span>
                  ) : null}
                </p>
              </div>
              <InputGroup>
                <InputGroupAddon aria-hidden="true">@</InputGroupAddon>
                <InputGroupInput
                  id={`${id}-username`}
                  value={draft.username}
                  className="pl-1.5"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-describedby={`${id}-username-rule`}
                  aria-invalid={Boolean(draft.username && (userProblem || status === "taken")) || undefined}
                  onChange={(event) => edit({ username: event.target.value.replace(/^@+/, "").replace(/\s/g, "") })}
                />
              </InputGroup>
              <p id={`${id}-username-rule`} className="text-xs text-muted-foreground">{USERNAME_RULE}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor={`${id}-bio`}>Bio</Label>
              <TextareaCounter
                key={epoch}
                id={`${id}-bio`}
                limit={bioLimit}
                rows={3}
                value={draft.bio}
                placeholder="A line or two about what you do."
                onChange={(event) => edit({ bio: event.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-baseline justify-between gap-3">
                <p id={`${id}-links`} className="text-sm leading-none font-medium">Links</p>
                <span className="text-xs text-muted-foreground tabular-nums">{draft.links.length} of {maxLinks}</span>
              </div>
              {draft.links.length ? (
                <ul ref={list} role="list" aria-labelledby={`${id}-links`} className="grid grid-cols-1 gap-3">
                  {draft.links.map((link, index) => {
                    const problem = touched[link.id] ? linkProblems[index] : null;
                    return (
                      <li key={link.id} data-link={link.id} className={cn("grid grid-cols-[minmax(0,1fr)_auto] gap-2 @md:grid-cols-[9rem_minmax(0,1fr)_auto]", link.id.startsWith("new-") && "motion-safe:animate-rhs-in")}>
                        <Input
                          aria-label={`Link ${index + 1} label`}
                          placeholder="Label"
                          value={link.label}
                          maxLength={40}
                          className="col-start-1 row-start-1"
                          onChange={(event) => editLink(link.id, { label: event.target.value })}
                        />
                        <Input
                          aria-label={`Link ${index + 1} address`}
                          aria-invalid={problem ? true : undefined}
                          type="url"
                          inputMode="url"
                          autoCapitalize="none"
                          spellCheck={false}
                          placeholder="https://"
                          value={link.url}
                          className="col-span-2 row-start-2 @md:col-span-1 @md:col-start-2 @md:row-start-1"
                          onBlur={() => touch(link.id)}
                          onChange={(event) => editLink(link.id, { url: event.target.value })}
                        />
                        <Button type="button" variant="ghost" size="icon" aria-label={`Remove link ${index + 1}`} className="-mr-2 col-start-2 row-start-1 @md:col-start-3" onClick={() => removeLink(link.id)}>
                          <IconClose />
                        </Button>
                        {problem ? (
                          <p role="alert" className="col-span-full flex items-center gap-1.5 text-xs font-medium text-destructive motion-safe:animate-rhs-in">
                            <IconAlertCircle className="size-3.5 shrink-0" />
                            {problem}
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No links yet. Add your site, a portfolio or a profile elsewhere.</p>
              )}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Button ref={addLinkButton} type="button" variant="outline" size="sm" disabled={draft.links.length >= maxLinks} onClick={addLink}>
                  <IconPlus />
                  Add link
                </Button>
                {draft.links.length >= maxLinks ? <span className="text-xs text-muted-foreground">That is the most a profile can show.</span> : null}
              </div>
            </div>
          </div>
          <aside aria-hidden="true" inert data-slot="public-profile-preview" className="self-start rounded-xl border border-border bg-muted/30 p-5 @3xl:sticky @3xl:top-6">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <IconEye className="size-3.5" />
              Preview
            </p>
            <div className="mt-5 flex flex-col items-center text-center">
              <Avatar size="lg" className="data-[size=lg]:size-20">
                {draft.avatar ? <AvatarImage src={draft.avatar} alt="" /> : null}
                <AvatarFallback className="text-xl group-data-[size=lg]/avatar:text-xl">{initialsOf(shown.displayName) || <IconUser className="size-7" />}</AvatarFallback>
              </Avatar>
              <p className={cn("mt-4 text-lg font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]", !shown.displayName && "text-muted-foreground")}>{shown.displayName || "Your name"}</p>
              <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">@{draft.username || "username"}</p>
              <p className={cn("mt-3 text-sm leading-relaxed [overflow-wrap:anywhere]", !shown.bio && "text-muted-foreground")}>{shown.bio || "Your bio appears here."}</p>
            </div>
            {shownLinks.length ? (
              <ul role="list" className="mt-5 grid grid-cols-1 gap-2">
                {shownLinks.map((link) => (
                  <li key={link.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{link.label || displayUrl(link.url)}</span>
                      {link.label ? <span className="block truncate text-xs text-muted-foreground">{displayUrl(link.url)}</span> : null}
                    </span>
                    <IconArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                  </li>
                ))}
              </ul>
            ) : null}
          </aside>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-b-xl border-t border-border bg-muted/40 px-6 py-3.5">
          <Button ref={saveButton} type="submit" disabled={!dirty || invalid} loading={phase === "saving"}>
            Save changes
          </Button>
          <Button type="button" variant="outline" disabled={!dirty || phase === "saving"} onClick={discard}>
            Discard
          </Button>
          <p
            ref={statusLine}
            tabIndex={-1}
            role="status"
            aria-live="polite"
            className={cn("flex items-center gap-2 rounded-sm text-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:ml-1", phase === "error" ? "font-medium text-destructive" : "text-muted-foreground")}
          >
            {phase === "saved" && !dirty ? <IconCheckCircle className="size-4 shrink-0 text-foreground" /> : null}
            {phase === "error" ? <IconAlertCircle className="size-4 shrink-0" /> : null}
            {phase === "saving" ? "Saving…" : phase === "error" ? "Could not save. Try again." : phase === "saved" && !dirty ? "Profile saved" : dirty ? "You have unsaved changes." : ""}
          </p>
        </div>
      </form>
    </Card>
  );
}
