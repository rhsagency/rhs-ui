"use client";

import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";

import { IconCheck, IconLink, IconSpinner } from "@rhs-ui/icons";
import { CopyField } from "@rhs-ui/application/copy-field";
import { DEFAULT_LANGUAGES, DEFAULT_TIME_ZONES, TIME_ZONE_NAMES, type WorkspaceLanguage } from "@rhs-ui/application/workspace-profile-section/defaults";
import { Button } from "@rhs-ui/primitives/button";
import { Callout } from "@rhs-ui/primitives/callout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Combobox, type ComboboxOption } from "@rhs-ui/primitives/combobox";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { cn } from "@/lib/utils";

/** A workspace as this section edits it. The id is read-only. */
export interface Workspace {
  name: string;
  /** The part of the address that names it: lowercase letters, numbers and hyphens. */
  slug: string;
  /** IANA time zone, "Europe/Amsterdam". */
  timeZone: string;
  /** Language code, "en". */
  language: string;
  /** Stable identifier, shown to copy and never changed here. */
  id: string;
}

/** What Save hands back: everything the section can change. */
export type WorkspaceChanges = Pick<Workspace, "name" | "slug" | "timeZone" | "language">;

export interface WorkspaceProfileSectionProps {
  /** The workspace as it is stored. Pass the new one after a save and the form follows. */
  workspace: Workspace;
  /** The address the slug lives under, "app.kestrel.dev". Add a protocol if it is not https. */
  baseUrl: string;
  /** Saves the changes. Return or resolve to a message to show a failure, or to nothing when it worked. */
  onSave: (changes: WorkspaceChanges) => Promise<string | void> | string | void;
  /** Asks whether a slug is free, for the hint under the field. Resolve to true when it is available. */
  onCheckSlug?: (slug: string) => Promise<boolean> | boolean;
  /** IANA time zones to offer, listed in the order you pass them. A sensible spread of the world by default. */
  timeZones?: readonly string[];
  /** Languages to offer, each named in its own language. */
  languages?: readonly WorkspaceLanguage[];
  /** Language used to write the time zone offsets, and the one a language can also be searched by ("German" finds Deutsch). */
  locale?: string;
  /** The heading. */
  title?: string;
  /** The line under the heading. */
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  /** Extra classes for the outermost element. */
  className?: string;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Lowercase letters, numbers and hyphens only: spaces become hyphens, anything else is dropped as you type. */
function foldSlug(raw: string): string {
  return raw.toLowerCase().replace(/\s+/g, "-");
}
function cleanSlug(raw: string): string {
  return foldSlug(raw).replace(/[^a-z0-9-]/g, "").replace(/-{2,}/g, "-").replace(/^-+/, "").slice(0, 40);
}

// A flat list, no keywords and no groups on purpose: the search scores the IANA name and the label, so a typed
// "tok" puts Tokyo first, where groups (which the search does not reorder) would put New York above it.
function zoneOption(zone: string, locale: string, at: Date): ComboboxOption {
  if (zone === "UTC") return { value: zone, label: "UTC", keywords: ["gmt", "coordinated universal time"] };
  const city = TIME_ZONE_NAMES[zone] ?? (zone.split("/").at(-1) ?? zone).replace(/_/g, " ");
  let offset = "";
  try {
    offset = new Intl.DateTimeFormat(locale, { timeZone: zone, timeZoneName: "shortOffset" }).formatToParts(at).find((part) => part.type === "timeZoneName")?.value ?? "";
  } catch {
    offset = "";
  }
  return { value: zone, label: offset ? `${city} (${offset})` : city };
}

/** What is wrong with an address, in a sentence, or null when it is fine. */
function slugIssue(slug: string): string | null {
  if (!slug) return "Enter an address for the workspace.";
  if (slug.length < 3) return "Use at least 3 characters.";
  if (!SLUG.test(slug)) return "Start and end the address with a letter or a number.";
  return null;
}

/** Each language as an option of the picker, searchable by its name in the reader's language as well ("German" finds Deutsch). */
function languageOption(entry: WorkspaceLanguage, names: Intl.DisplayNames | null): ComboboxOption {
  let named = "";
  try {
    named = names?.of(entry.value) ?? "";
  } catch {
    named = "";
  }
  return { value: entry.value, label: entry.label, keywords: [entry.value, named].filter(Boolean) };
}

function pick(workspace: Workspace): WorkspaceChanges {
  return { name: workspace.name, slug: workspace.slug, timeZone: workspace.timeZone, language: workspace.language };
}

/**
 * The settings page every multi-tenant product needs: the workspace's name,
 * its address, and the time zone and language new members start from. The
 * address sits in an input group under your domain, is limited to lowercase
 * letters, numbers and hyphens as you type, previews the full link live,
 * says whether it is free, and warns in words that old links stop working
 * before you save. The read-only workspace ID is one press from the
 * clipboard. Save and Discard light up when something changed, and the fields
 * lock while it saves, so nothing typed in the meantime is lost.
 */
export function WorkspaceProfileSection({ workspace, baseUrl, onSave, onCheckSlug, timeZones, languages, locale = "en-US", title = "Workspace", description = "Its name and address, and the time zone and language new members start with.", headingLevel = 2, className }: WorkspaceProfileSectionProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const [base, setBase] = useState<WorkspaceChanges>(() => pick(workspace));
  const [draft, setDraft] = useState<WorkspaceChanges>(() => pick(workspace));
  const [touched, setTouched] = useState({ slug: false });
  const [submitted, setSubmitted] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<"no" | "yes" | "address">("no");
  // The field that had the focus when the save began; the fields are locked meanwhile, so it is given back afterwards.
  const focusAfter = useRef<HTMLElement | null>(null);

  // A workspace passed in from outside replaces the draft. The echo of our own save is not new: it is already the saved
  // baseline, so it waits until the save is done and then changes nothing, and whatever was typed in the meantime stays.
  const incoming = JSON.stringify(pick(workspace));
  const [seen, setSeen] = useState(incoming);
  if (seen !== incoming && !saving) {
    setSeen(incoming);
    if (incoming !== JSON.stringify(base)) {
      setBase(pick(workspace));
      setDraft(pick(workspace));
      setSubmitted(false);
    }
  }

  useEffect(() => {
    if (saving) return;
    const target = focusAfter.current;
    focusAfter.current = null;
    const active = document.activeElement;
    const lost = !active || active === document.body || active === target || active.matches(":disabled");
    if (target?.isConnected && lost) target.focus();
  }, [saving]);

  const host = baseUrl.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const origin = /^http:\/\//.test(baseUrl) ? `http://${host}` : `https://${host}`;
  const dirty = JSON.stringify(draft) !== JSON.stringify(base);

  // A hyphen at the end is the start of the next word, not yet part of the address: the warning, the check and the
  // status judge the address without it, so typing one changes nothing on screen. Save still wants it gone.
  const core = draft.slug.replace(/-+$/, "");
  const addressChanged = core !== base.slug;
  const coreProblem = slugIssue(core);

  const nameProblem = draft.name.trim() ? null : "Give the workspace a name.";
  const slugProblem = slugIssue(draft.slug);

  // Whether a new address is free: asked after a pause in typing, and remembered per address.
  const checkable = Boolean(onCheckSlug && addressChanged && !coreProblem);
  const [answers, setAnswers] = useState<Record<string, "free" | "taken" | "unknown">>({});
  const checker = useRef(onCheckSlug);
  useEffect(() => {
    checker.current = onCheckSlug;
  });
  const answer = answers[core];
  useEffect(() => {
    if (!checkable || answer) return;
    let live = true;
    const slug = core;
    const timer = window.setTimeout(() => {
      Promise.resolve()
        .then(() => checker.current?.(slug))
        .then(
          (free): "free" | "taken" | "unknown" => (free === true ? "free" : free === false ? "taken" : "unknown"),
          (): "free" | "taken" | "unknown" => "unknown",
        )
        .then((result) => {
          if (live) setAnswers((current) => ({ ...current, [slug]: result }));
        });
    }, 400);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [checkable, answer, core]);
  const taken = checkable && answer === "taken";
  const warnAboutLinks = addressChanged && !coreProblem;

  const shownName = submitted ? nameProblem : null;
  const shownSlug = taken ? `${core} is already taken. Try another address.` : submitted || (touched.slug && draft.slug) ? slugProblem : null;

  const zoneList = timeZones ?? DEFAULT_TIME_ZONES;
  const zoneOptions = useMemo<ComboboxOption[]>(() => {
    const at = new Date();
    const zones = zoneList.includes(draft.timeZone) ? zoneList : [draft.timeZone, ...zoneList];
    return zones.map((zone) => zoneOption(zone, locale, at));
  }, [zoneList, draft.timeZone, locale]);
  const languageList = languages ?? DEFAULT_LANGUAGES;
  const languageOptions = useMemo<ComboboxOption[]>(() => {
    const all = languageList.some((entry) => entry.value === draft.language) ? languageList : [{ value: draft.language, label: draft.language }, ...languageList];
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([locale], { type: "language" });
    } catch {
      names = null;
    }
    return all.map((entry) => languageOption(entry, names));
  }, [languageList, draft.language, locale]);

  function change(patch: Partial<WorkspaceChanges>) {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved("no");
    setFormError(null);
  }

  function discard() {
    setDraft(base);
    setTouched({ slug: false });
    setSubmitted(false);
    setRejected(false);
    setFormError(null);
    setSaved("no");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSubmitted(true);
    const first = nameProblem ? "name" : slugProblem || taken ? "slug" : null;
    if (first) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>(`[data-field="${first}"] [id$="-control"]`)?.focus());
      return;
    }
    const active = document.activeElement;
    focusAfter.current = active instanceof HTMLElement && form.current?.contains(active) ? active : null;
    setSaving(true);
    setFormError(null);
    const settle = (changes: WorkspaceChanges): WorkspaceChanges => ({ ...changes, name: changes.name.trim() });
    const next = settle(draft);
    const moved = addressChanged;
    try {
      const result = await onSave(next);
      if (typeof result === "string" && result) setFormError(result);
      else {
        setBase(next);
        // The fields were locked while saving, so the draft is what was saved (now trimmed). Anything typed since stays, and reads as unsaved.
        setDraft((current) => (JSON.stringify(settle(current)) === JSON.stringify(next) ? next : current));
        setSubmitted(false);
        setTouched({ slug: false });
        setSaved(moved ? "address" : "yes");
      }
    } catch {
      setFormError("That did not save. Your changes are still here, so you can try again.");
    } finally {
      setSaving(false);
    }
  }

  const slugStatus = !addressChanged ? "Current address" : checkable && !answer ? "checking" : checkable && answer === "free" ? "free" : null;

  return (
    <section data-slot="workspace-profile-section" aria-labelledby={`${id}-title`} className={cn("w-full", className)}>
      <Card className="gap-0 overflow-hidden py-0">
        <form ref={form} noValidate onSubmit={(event) => void save(event)}>
          <CardHeader className="px-6 pt-6 pb-6">
            <CardTitle asChild className="text-lg tracking-[-0.02em]">
              <Heading id={`${id}-title`}>{title}</Heading>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {/* Locked while the save runs, so nothing typed in flight can be lost when it comes back. */}
            <fieldset disabled={saving} className="contents">
              <div className="grid grid-cols-1 items-start gap-x-5 gap-y-6 sm:grid-cols-2">
                <FormField data-field="name" error={shownName} described className="sm:col-span-2">
                  <FormLabel className="min-h-5">Workspace name</FormLabel>
                  <FormControl>
                    <Input name="name" autoComplete="organization" maxLength={60} value={draft.name} onChange={(event: ChangeEvent<HTMLInputElement>) => change({ name: event.target.value })} />
                  </FormControl>
                  <FormDescription>Shown in the sidebar, in emails and on invoices.</FormDescription>
                </FormField>

                <div className="sm:col-span-2">
                  <FormField data-field="slug" error={shownSlug} described>
                    <FormLabel className="min-h-5">Workspace URL</FormLabel>
                    <InputGroup>
                      <InputGroupAddon className="max-w-[60%]">
                        <span className="truncate">{host}/</span>
                      </InputGroupAddon>
                      <FormControl>
                        <InputGroupInput
                          name="slug"
                          autoComplete="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          maxLength={40}
                          value={draft.slug}
                          className="pl-0"
                          onChange={(event: ChangeEvent<HTMLInputElement>) => {
                            const cleaned = cleanSlug(event.target.value);
                            setRejected(cleaned !== foldSlug(event.target.value));
                            change({ slug: cleaned });
                          }}
                          onBlur={() => {
                            setTouched({ slug: true });
                            setRejected(false);
                            setDraft((current) => ({ ...current, slug: current.slug.replace(/-+$/, "") }));
                          }}
                        />
                      </FormControl>
                    </InputGroup>
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                      <FormDescription className={cn("transition-colors duration-150 motion-reduce:transition-none", rejected && "font-medium text-foreground")}>Lowercase letters, numbers and hyphens.</FormDescription>
                      <span role="status" className="inline-flex min-h-4 items-center gap-1.5 text-xs text-muted-foreground">
                        {slugStatus === "checking" ? (
                          <>
                            <IconSpinner size={12} />
                            Checking
                          </>
                        ) : slugStatus === "free" ? (
                          <>
                            <IconCheck className="size-3.5 text-foreground" />
                            Available
                          </>
                        ) : (
                          slugStatus
                        )}
                      </span>
                    </div>
                  </FormField>
                  <p className="mt-3 flex items-start gap-2.5 rounded-lg bg-muted/60 px-3 py-2.5 text-[0.8125rem] text-muted-foreground">
                    <IconLink className="mt-0.5 size-4 shrink-0" />
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      <span className="sr-only">Your workspace will open at </span>
                      <span className="font-mono">
                        {origin}/<span className="font-medium text-foreground">{draft.slug || "your-workspace"}</span>
                      </span>
                    </span>
                  </p>
                  {/* A callout that appears on its own is not read out. This wrapper is always there, so the warning is announced the moment it shows (and takes no room while it is empty). */}
                  <div aria-live="polite" className="mt-3 empty:mt-0">
                    {/* It keeps the warning icon and the spoken "Warning", on a neutral surface: a consumer's theme has no warning colour. */}
                    {warnAboutLinks ? (
                      <Callout tone="warning" title="Old links will stop working" className="border-border bg-muted/50">
                        Anyone using <code>{base.slug}</code> will need the new address as soon as you save.
                      </Callout>
                    ) : null}
                  </div>
                </div>

                <FormField>
                  <FormLabel className="min-h-5">Default time zone</FormLabel>
                  <FormControl>
                    <Combobox label="Default time zone" options={zoneOptions} value={draft.timeZone} onValueChange={(zone) => change({ timeZone: zone })} searchPlaceholder="Search cities" emptyText="No time zone found" />
                  </FormControl>
                </FormField>

                <FormField>
                  <FormLabel className="min-h-5">Default language</FormLabel>
                  <FormControl>
                    <Combobox label="Default language" options={languageOptions} value={draft.language} onValueChange={(language) => change({ language })} searchPlaceholder="Search languages" emptyText="No language found" />
                  </FormControl>
                </FormField>

                <div className="grid gap-2 sm:col-span-2">
                  <p id={`${id}-id`} className="flex min-h-5 items-center text-sm leading-none font-medium">
                    Workspace ID
                  </p>
                  <p className="text-xs text-muted-foreground">Read only. Use it in API requests and when you contact support.</p>
                  {/* CopyField keeps a line free under itself for "Copied"; it borrows half of the card's bottom padding, so the line never sits on the rule. */}
                  <CopyField value={workspace.id} label="Copy workspace ID" className="-mb-3" />
                </div>
              </div>
            </fieldset>
          </CardContent>

          <div data-slot="workspace-profile-footer" className="flex flex-col gap-3 border-t border-border bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite" className="min-w-0 text-sm">
              {formError ? (
                <p className="text-destructive">{formError}</p>
              ) : saving ? (
                <p className="text-muted-foreground">Saving</p>
              ) : submitted && (nameProblem || slugProblem || taken) ? (
                <p className="text-destructive">Check the highlighted fields.</p>
              ) : dirty ? (
                <p className="flex items-center gap-2 font-medium">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />
                  Unsaved changes
                </p>
              ) : saved !== "no" ? (
                <p className="flex items-center gap-2">
                  <IconCheck className="size-4 shrink-0" />
                  {saved === "address" ? "Saved. The new address is live." : "Saved."}
                </p>
              ) : (
                <p className="text-muted-foreground">No unsaved changes</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={discard} disabled={!dirty || saving}>
                Discard
              </Button>
              <Button type="submit" loading={saving} disabled={!dirty || taken}>
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </section>
  );
}
