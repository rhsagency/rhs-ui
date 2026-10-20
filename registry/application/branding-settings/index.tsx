"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { IconCheck, IconClose, IconSpinner, IconWarning } from "@rhs-ui/icons";
import { DEFAULT_BRAND_COLORS, checkBrandColor, formatRatio, levelName } from "@rhs-ui/application/branding-settings/color";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { ColorPicker } from "@rhs-ui/primitives/color-picker";
import { FileTrigger } from "@rhs-ui/primitives/file-trigger";
import { cn } from "@/lib/utils";

/** The three images a workspace brings. */
export type BrandingAsset = "logoLight" | "logoDark" | "icon";

/** What the customer sees: the images by URL and one brand colour. */
export interface BrandingValue {
  /** The logo for light backgrounds, as a URL. Empty for none yet. */
  logoLight: string;
  /** The logo for dark backgrounds, as a URL. */
  logoDark: string;
  /** The square icon, as a URL. */
  icon: string;
  /** The brand colour, "#rrggbb". */
  color: string;
}

export interface BrandingSettingsProps {
  /** The branding as it is stored. Pass the new one after a save and the form follows. */
  value: BrandingValue;
  /** Saves the branding. Return or resolve to a message to show a failure, or to nothing when it worked. */
  onSave: (value: BrandingValue) => Promise<string | void> | string | void;
  /** Uploads a chosen file and resolves to the URL it can be shown from. Reject to say the upload failed. */
  onUpload: (kind: BrandingAsset, file: File) => Promise<string>;
  /** The colours offered as swatches, "#rrggbb". Anything else can still be typed as a hex code. */
  colors?: readonly string[];
  /** The contrast text needs on the brand colour: 4.5 is WCAG AA for normal text, 7 is AAA. */
  minContrast?: number;
  /** The name shown in the previews. */
  name?: string;
  /** The heading. */
  title?: string;
  /** The line under the heading. */
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  /** Extra classes for the outermost element. */
  className?: string;
}

const KIND_LABEL: Record<BrandingAsset, string> = {
  logoLight: "Logo for light backgrounds",
  logoDark: "Logo for dark backgrounds",
  icon: "Icon",
};

/** SVG or PNG, by the type the system reports or, when it reports none, by the name. The accept attribute only steers the file dialog; "All files" gets around it. */
function isImageFile(file: File): boolean {
  if (file.type) return file.type === "image/svg+xml" || file.type === "image/png";
  return /\.(svg|png)$/i.test(file.name);
}

const ASSETS: readonly BrandingAsset[] = ["logoLight", "logoDark", "icon"];

function sameBranding(a: BrandingValue, b: BrandingValue): boolean {
  return a.logoLight === b.logoLight && a.logoDark === b.logoDark && a.icon === b.icon && a.color === b.color;
}

function LogoField({ field, labelId, label, tone, url, name, uploading, error, onFile, onBroken, triggerKey }: { field: BrandingAsset; labelId: string; label: string; tone: "light" | "dark"; url: string; name: string; uploading: boolean; error?: string; onFile: (file: File | null) => void; onBroken: (url: string) => void; triggerKey: number }) {
  return (
    <div role="group" aria-labelledby={labelId} className="grid content-start gap-3">
      <p id={labelId} className="text-sm leading-none font-medium">
        {label}
      </p>
      <div className={cn("relative grid h-28 place-items-center overflow-hidden rounded-lg border border-border", tone === "light" ? "bg-white" : "bg-neutral-950")}>
        {url ? (
          <img src={url} alt={`${name} logo`} onError={() => onBroken(url)} className={cn("max-h-12 max-w-[70%] object-contain transition-opacity duration-200 motion-reduce:transition-none", uploading && "opacity-0")} />
        ) : (
          <span className={cn("text-xs", tone === "light" ? "text-neutral-500" : "text-neutral-400")}>No logo yet</span>
        )}
        {uploading ? (
          <span role="status" className={cn("absolute inset-0 grid place-items-center text-xs font-medium", tone === "light" ? "text-neutral-900" : "text-neutral-50")}>
            <span className="inline-flex items-center gap-2">
              <IconSpinner size={14} />
              Uploading
            </span>
          </span>
        ) : null}
      </div>
      <FileTrigger key={triggerKey} name={field} accept="image/svg+xml,image/png" maxSize={1_000_000} label={url ? "Replace logo" : "Upload logo"} onFileChange={onFile} />
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">SVG or PNG, up to 1 MB.</p>
      )}
    </div>
  );
}

// The two previews show the customer's page and inbox, not this product, so they are drawn on literal white whatever the theme.
function PagePreview({ name, logo, icon, color, textColor, onBroken }: { name: string; logo: string; icon: string; color: string; textColor: string; onBroken: (url: string) => void }) {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-lg border border-border bg-white text-neutral-900 shadow-xs">
      <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-100 px-3 py-2">
        <span className="flex gap-1">
          <i className="size-1.5 rounded-full bg-neutral-300" />
          <i className="size-1.5 rounded-full bg-neutral-300" />
          <i className="size-1.5 rounded-full bg-neutral-300" />
        </span>
        <span className="flex min-w-0 items-center gap-1.5 rounded bg-white px-1.5 py-1 text-[0.625rem] text-neutral-600">
          <Avatar className="rounded-[3px] data-[size=default]:size-3.5">
            <AvatarImage src={icon || undefined} alt="" onLoadingStatusChange={(status) => { if (status === "error" && icon) onBroken(icon); }} />
            <AvatarFallback className="rounded-[3px] bg-neutral-200 text-[0.5rem] text-neutral-600">{initialsOf(name).slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="truncate">{name} invoices</span>
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        {logo ? <img src={logo} alt="" onError={() => onBroken(logo)} className="h-5 max-w-[50%] object-contain" /> : <span className="text-sm font-semibold">{name}</span>}
        <span className="rounded-md px-2.5 py-1.5 text-[0.6875rem] font-medium whitespace-nowrap" style={{ backgroundColor: color, color: textColor }}>
          Pay invoice
        </span>
      </div>
      <div className="px-4 pb-4">
        <p className="text-[0.6875rem] text-neutral-500">Invoice 2041</p>
        <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">EUR 1,240.00</p>
        <p className="mt-2 text-[0.6875rem] font-medium underline underline-offset-2" style={{ color }}>
          Download PDF
        </p>
      </div>
    </div>
  );
}

function EmailPreview({ name, logo, color, textColor, onBroken }: { name: string; logo: string; color: string; textColor: string; onBroken: (url: string) => void }) {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-lg border border-border bg-white text-neutral-900 shadow-xs">
      <div className="px-4 py-3.5" style={{ backgroundColor: color, color: textColor }}>
        {logo ? <img src={logo} alt="" onError={() => onBroken(logo)} className="h-5 max-w-[60%] object-contain" /> : <span className="text-sm font-semibold">{name}</span>}
      </div>
      <div className="px-4 py-4">
        <p className="text-xs font-semibold">Invoice 2041 is ready</p>
        <p className="mt-1 text-[0.6875rem] leading-relaxed text-neutral-500">Hi Ada, here is your invoice from {name}. It is due on 3 November.</p>
        <span className="mt-3 inline-block rounded-md px-3 py-1.5 text-[0.6875rem] font-medium" style={{ backgroundColor: color, color: textColor }}>
          View invoice
        </span>
      </div>
    </div>
  );
}

/**
 * How a workspace looks to its customers: a logo for light backgrounds and
 * one for dark, a square icon and one brand colour. Each logo is previewed on
 * the background it is made for, and a page header and an email header update
 * as you change things. The colour is checked against white and black text
 * and the result is said in words; a colour that cannot carry text or stand
 * out on a white page is refused with the reason. Only SVG and PNG files are
 * taken, an image that cannot be drawn is put back with a message, and the
 * fields lock while it saves. The product itself stays monochrome: only the
 * customer-facing previews take the brand.
 */
export function BrandingSettings({ value, onSave, onUpload, colors, minContrast = 4.5, name = "Northwind", title = "Branding", description = "What your customers see on invoices, payment pages and emails from you.", headingLevel = 2, className }: BrandingSettingsProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const id = useId();
  const [base, setBase] = useState<BrandingValue>(value);
  const [draft, setDraft] = useState<BrandingValue>(value);
  const [uploading, setUploading] = useState<Partial<Record<BrandingAsset, boolean>>>({});
  const [uploadErrors, setUploadErrors] = useState<Partial<Record<BrandingAsset, string>>>({});
  const [refusal, setRefusal] = useState<{ hex: string; reason: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const tickets = useRef<Record<BrandingAsset, number>>({ logoLight: 0, logoDark: 0, icon: 0 });
  const picker = useRef<HTMLDivElement>(null);
  const [pickerKey, setPickerKey] = useState(0);
  // A file field forgets the file as soon as it is handed over, because the preview tile shows the result: it keeps its label and never a stale file name.
  const [triggerKeys, setTriggerKeys] = useState<Record<BrandingAsset, number>>({ logoLight: 0, logoDark: 0, icon: 0 });
  const root = useRef<HTMLElement>(null);
  // Addresses that turned out not to be images that can be drawn. They are shown as "No logo yet" instead of a broken picture.
  const [broken, setBroken] = useState<Readonly<Record<string, true>>>({});
  // The field that had the focus when the save began; the fields are locked meanwhile, so it is given back afterwards.
  const focusAfter = useRef<HTMLElement | null>(null);

  // New branding from outside replaces the draft. The echo of our own save is not new: it is already the saved
  // baseline, so it waits until the save is done and then changes nothing, and whatever was changed meanwhile stays.
  const incoming = JSON.stringify(value);
  const [seen, setSeen] = useState(incoming);
  if (seen !== incoming && !saving) {
    setSeen(incoming);
    if (!sameBranding(value, base)) {
      setBase(value);
      setDraft(value);
      setRefusal(null);
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

  const dirty = JSON.stringify(draft) !== JSON.stringify(base);
  const busy = Object.values(uploading).some(Boolean);
  const check = checkBrandColor(draft.color, minContrast) ?? checkBrandColor("#111111", minContrast)!;
  const textColor = check.text === "white" ? "#ffffff" : "#000000";
  const level = levelName(minContrast);
  const usable = (url: string) => (url && !broken[url] ? url : "");
  const logoLight = usable(draft.logoLight);
  const logoDark = usable(draft.logoDark);
  const iconUrl = usable(draft.icon);
  // On the brand colour the logo made for dark backgrounds is the one that reads, when the text on it is white.
  const bandLogo = check.text === "white" ? logoDark || logoLight : logoLight || logoDark;

  function change(patch: Partial<BrandingValue>) {
    setDraft((current) => ({ ...current, ...patch }));
    setSaved(false);
    setFormError(null);
  }

  function pickColor(hex: string) {
    const next = checkBrandColor(hex, minContrast);
    if (!next) return;
    if (next.refusal) {
      setRefusal({ hex, reason: next.refusal });
      // Closing the picker (a new key starts it closed) puts the reason in view; focus goes back to it.
      setPickerKey((key) => key + 1);
      requestAnimationFrame(() => picker.current?.querySelector<HTMLElement>('[data-slot="color-picker"]')?.focus());
      return;
    }
    setRefusal(null);
    change({ color: hex.toLowerCase() });
  }

  // An address that cannot be drawn is taken back to what was there, with the reason, so a broken picture is never saved.
  function assetFailed(url: string) {
    setBroken((current) => (current[url] ? current : { ...current, [url]: true }));
    for (const kind of ASSETS) {
      if (draft[kind] !== url) continue;
      const stored = base[kind] === url;
      setUploadErrors((current) => ({ ...current, [kind]: stored ? "The saved image could not be shown. Upload it again." : "That file could not be shown as an image. Try another SVG or PNG." }));
      if (!stored) change({ [kind]: base[kind] });
    }
  }

  async function receive(kind: BrandingAsset, file: File | null) {
    // The file dialog's "All files" gets past the accept attribute, so the type is checked here. Nothing else changes: an upload already running goes on.
    if (file && !isImageFile(file)) {
      setUploadErrors((current) => ({ ...current, [kind]: "Use an SVG or a PNG file." }));
      setTriggerKeys((keys) => ({ ...keys, [kind]: keys[kind] + 1 }));
      requestAnimationFrame(() => root.current?.querySelector<HTMLInputElement>(`input[type="file"][name="${kind}"]`)?.focus());
      return;
    }
    const ticket = ++tickets.current[kind];
    setUploadErrors((current) => ({ ...current, [kind]: undefined }));
    // Removing the chosen file goes back to what is stored.
    if (!file) {
      setUploading((current) => ({ ...current, [kind]: false }));
      change({ [kind]: base[kind] });
      return;
    }
    setUploading((current) => ({ ...current, [kind]: true }));
    setTriggerKeys((keys) => ({ ...keys, [kind]: keys[kind] + 1 }));
    requestAnimationFrame(() => root.current?.querySelector<HTMLInputElement>(`input[type="file"][name="${kind}"]`)?.focus());
    try {
      const url = await onUpload(kind, file);
      if (ticket === tickets.current[kind]) change({ [kind]: url });
    } catch {
      if (ticket === tickets.current[kind]) setUploadErrors((current) => ({ ...current, [kind]: "That upload failed. Check the file and try again." }));
    } finally {
      if (ticket === tickets.current[kind]) setUploading((current) => ({ ...current, [kind]: false }));
    }
  }

  function discard() {
    tickets.current = { logoLight: tickets.current.logoLight + 1, logoDark: tickets.current.logoDark + 1, icon: tickets.current.icon + 1 };
    setDraft(base);
    setUploading({});
    setUploadErrors({});
    setRefusal(null);
    setFormError(null);
    setSaved(false);
    // A refusal a file field is still showing (a file that was too big) goes with it.
    setTriggerKeys((keys) => ({ logoLight: keys.logoLight + 1, logoDark: keys.logoDark + 1, icon: keys.icon + 1 }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || busy) return;
    const active = document.activeElement;
    focusAfter.current = active instanceof HTMLElement && root.current?.contains(active) ? active : null;
    setSaving(true);
    setFormError(null);
    // The fields are locked from here on, so this is what is saved and what the form shows when it is done.
    const next = draft;
    try {
      const result = await onSave(next);
      if (typeof result === "string" && result) setFormError(result);
      else {
        setBase(next);
        setSaved(true);
      }
    } catch {
      setFormError("That did not save. Your changes are still here, so you can try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section ref={root} data-slot="branding-settings" aria-labelledby={`${id}-title`} className={cn("w-full", className)}>
      <Card className="gap-0 overflow-hidden py-0">
        <form noValidate onSubmit={(event) => void save(event)}>
          <CardHeader className="px-6 pt-6 pb-6">
            <CardTitle asChild className="text-lg tracking-[-0.02em]">
              <Heading id={`${id}-title`}>{title}</Heading>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {/* Locked while the save runs, so nothing changed in flight can be lost when it comes back. */}
            <fieldset disabled={saving} className="contents">
              <div className="grid grid-cols-1 items-start gap-x-6 gap-y-8 sm:grid-cols-2">
                <LogoField field="logoLight" labelId={`${id}-light`} label={KIND_LABEL.logoLight} tone="light" url={logoLight} name={name} uploading={Boolean(uploading.logoLight)} error={uploadErrors.logoLight} onFile={(file) => void receive("logoLight", file)} onBroken={assetFailed} triggerKey={triggerKeys.logoLight} />
                <LogoField field="logoDark" labelId={`${id}-dark`} label={KIND_LABEL.logoDark} tone="dark" url={logoDark} name={name} uploading={Boolean(uploading.logoDark)} error={uploadErrors.logoDark} onFile={(file) => void receive("logoDark", file)} onBroken={assetFailed} triggerKey={triggerKeys.logoDark} />

                <div role="group" aria-labelledby={`${id}-icon`} className="grid content-start gap-3">
                  <p id={`${id}-icon`} className="text-sm leading-none font-medium">
                    {KIND_LABEL.icon}
                  </p>
                  <div className="flex items-center gap-4">
                    <Avatar className="rounded-xl border border-border data-[size=default]:size-16">
                      <AvatarImage src={iconUrl || undefined} alt={`${name} icon`} onLoadingStatusChange={(status) => { if (status === "error" && iconUrl) assetFailed(iconUrl); }} />
                      <AvatarFallback className="rounded-xl text-lg">{initialsOf(name)}</AvatarFallback>
                    </Avatar>
                    <div className="grid min-w-0 gap-1.5">
                      <FileTrigger key={triggerKeys.icon} name="icon" accept="image/svg+xml,image/png" maxSize={1_000_000} label={iconUrl ? "Replace icon" : "Upload icon"} onFileChange={(file) => void receive("icon", file)} />
                      {uploading.icon ? (
                        <p role="status" className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                          <IconSpinner size={12} />
                          Uploading
                        </p>
                      ) : uploadErrors.icon ? (
                        <p role="alert" className="text-xs text-destructive">
                          {uploadErrors.icon}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Square, at least 128 px.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div role="group" aria-labelledby={`${id}-color`} className="grid content-start gap-3">
                  <p id={`${id}-color`} className="text-sm leading-none font-medium">
                    Brand colour
                  </p>
                  <div ref={picker} className="justify-self-start">
                    <ColorPicker key={pickerKey} label="Brand colour" value={draft.color} swatches={colors ?? DEFAULT_BRAND_COLORS} onValueChange={pickColor} className={cn(refusal && "border-destructive")} />
                  </div>
                  <div role="status" className="grid gap-1.5 text-xs">
                    {refusal ? (
                      <p className="flex items-start gap-2 text-destructive">
                        <IconWarning className="mt-0.5 size-3.5 shrink-0" />
                        <span>
                          <span className="font-mono">{refusal.hex.toUpperCase()}</span> was not applied. {refusal.reason}
                        </span>
                      </p>
                    ) : null}
                    {(["white", "black"] as const).map((tone) => {
                      const passes = check[tone] >= minContrast;
                      return (
                        <p key={tone} className={cn("flex items-start gap-2", passes ? "text-foreground" : "text-muted-foreground")}>
                          {passes ? <IconCheck className="mt-0.5 size-3.5 shrink-0" /> : <IconClose className="mt-0.5 size-3.5 shrink-0" />}
                          <span>
                            {tone === "white" ? "White" : "Black"} text {passes ? "passes" : "does not pass"} {level} on this colour <span className="tabular-nums">({formatRatio(check[tone])}:1)</span>.
                          </span>
                        </p>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-sm leading-none font-medium">Preview</p>
                    <p className="text-xs text-muted-foreground">Updates as you change things.</p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 items-start gap-5 rounded-xl border border-border bg-muted/50 p-4 sm:grid-cols-2 sm:p-5">
                    <div className="grid gap-2">
                      <p className="text-xs text-muted-foreground">Payment page</p>
                      <PagePreview name={name} logo={logoLight} icon={iconUrl} color={draft.color} textColor={textColor} onBroken={assetFailed} />
                    </div>
                    <div className="grid gap-2">
                      <p className="text-xs text-muted-foreground">Invoice email</p>
                      <EmailPreview name={name} logo={bandLogo} color={draft.color} textColor={textColor} onBroken={assetFailed} />
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
          </CardContent>

          <div data-slot="branding-settings-footer" className="flex flex-col gap-3 border-t border-border bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite" className="min-w-0 text-sm">
              {formError ? (
                <p className="text-destructive">{formError}</p>
              ) : saving ? (
                <p className="text-muted-foreground">Saving</p>
              ) : busy ? (
                <p className="text-muted-foreground">Waiting for the upload to finish</p>
              ) : dirty ? (
                <p className="flex items-center gap-2 font-medium">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />
                  Unsaved changes
                </p>
              ) : saved ? (
                <p className="flex items-center gap-2">
                  <IconCheck className="size-4 shrink-0" />
                  Saved. Customers see the new branding from now on.
                </p>
              ) : (
                <p className="text-muted-foreground">No unsaved changes</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={discard} disabled={(!dirty && !busy) || saving}>
                Discard
              </Button>
              <Button type="submit" loading={saving} disabled={!dirty || busy}>
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </section>
  );
}
