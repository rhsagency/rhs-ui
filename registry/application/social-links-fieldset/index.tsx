"use client";

import { useState, type ComponentProps, type ReactNode } from "react";

import { IconGlobe } from "@rhs-ui/icons";
import { checkHandle, toHandle, toWebsite, type SocialLinks, type SocialNetwork } from "@rhs-ui/application/social-links-fieldset/links";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { cn } from "@/lib/utils";

export type { SocialLinks, SocialNetwork } from "@rhs-ui/application/social-links-fieldset/links";

/** The words the fieldset says, for translation. `{prefix}` and `{network}` are filled in. */
export interface SocialLinksFieldsetLabels {
  /** The name of the website field. Default "Website". */
  website?: string;
  /** Beside the name of a field that is not required. Default "Optional". */
  optional?: string;
  /** Read after the label of a network field, so the part of the address that is already there is not lost on a screen reader. Default "The address starts with {prefix}. Paste a full link and it is cut down to the handle." */
  hint?: string;
  /** Under an empty required field. Default "Enter your {network} handle." */
  missing?: string;
  /** Under a handle that does not match, when the network has no message of its own. Default "Handles use letters, numbers, dots, dashes and underscores." */
  invalidHandle?: string;
  /** Under a website that is not an address. Default "Enter a web address like kestrel.dev." */
  invalidWebsite?: string;
}

export interface SocialLinksFieldsetProps extends Omit<ComponentProps<"fieldset">, "value" | "defaultValue" | "onChange" | "children"> {
  /** The networks to ask for, in order. */
  networks: readonly SocialNetwork[];
  /** The links, when you control them. They are shown as given: only what the person types is checked. */
  value?: SocialLinks;
  /** The links to begin with, when the fieldset keeps them itself. Shown as given, not checked. */
  defaultValue?: SocialLinks;
  /**
   * Called with all the links whenever one changes. A link that fails its check is an empty string until it is fixed, so
   * everything in the value has passed: a handle that matches its pattern, a website that is an http or https address. A
   * pasted link arrives as its handle, a leading @ gone, and the website with its https://.
   */
  onValueChange?: (value: SocialLinks) => void;
  /** Problems to show under fields, by network id (or "website"), from your own checks or the server. They take the place of the fieldset's own message for that field. */
  errors?: Readonly<Record<string, string | undefined>>;
  /** Ask for a website first. It takes anything that parses as a web address and adds https:// when it is missing. Default true. */
  showWebsite?: boolean;
  /** What the group is called. It is the legend, so a screen reader names the group before the first field. Default "Links". */
  legend?: ReactNode;
  /** Keep the legend for screen readers only, when the page has a heading of its own. */
  hideLegend?: boolean;
  /** The words the fieldset says, for translation. */
  labels?: SocialLinksFieldsetLabels;
}

const DEFAULT_LABELS = {
  website: "Website",
  optional: "Optional",
  hint: "The address starts with {prefix}. Paste a full link and it is cut down to the handle.",
  missing: "Enter your {network} handle.",
  invalidHandle: "Handles use letters, numbers, dots, dashes and underscores.",
  invalidWebsite: "Enter a web address like kestrel.dev.",
} satisfies Required<SocialLinksFieldsetLabels>;

type Words = Required<SocialLinksFieldsetLabels>;

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** What a handle puts into the value: itself once it has passed its check, nothing before. */
const handleOut = (network: SocialNetwork, handle: string) => (checkHandle(network, handle) ? "" : handle);

/** What the text in the website field puts into the value: the address once it is one, nothing before. */
function websiteOut(raw: string): string {
  const result = toWebsite(raw);
  return result.valid ? result.value : "";
}

/** The leading cell of a field: the fixed part of the address or an icon, set off from what is typed. */
const CELL = "border-r border-border bg-muted/40 first:pr-3";

/**
 * The fieldset for the links on a profile: a website, and a handle for each network you choose. Every row is a labelled
 * input group with the fixed part of the address as its own cell ("github.com/"), so people type only the handle. Pasting a
 * full link is accepted and cut down to the handle on the spot, a leading @ is stripped, and a handle that does not match
 * is explained in words when the field is left ("Handles use letters, numbers and dashes."). The website takes anything
 * that parses as a web address and adds https:// when it is missing.
 *
 * Only what passed leaves the fieldset: `onValueChange`, and the hidden input each field sends under its name, hold a handle
 * that matches its pattern, a website that is an http or https address, or an empty string, never the text that failed, so
 * a value is safe to use as a link. The text itself stays in the field until it is fixed, with the message beside it. The
 * browser can be bypassed, so run `cleanSocialLinks` (from social-links-fieldset/links, which has no "use client") on the
 * server as well. Networks are named in text, every row is a labelled input in tab order, and a row that is not required
 * says "Optional". Nothing is sent anywhere: the links only return through `onValueChange`.
 */
export function SocialLinksFieldset({
  networks,
  value,
  defaultValue,
  onValueChange,
  errors,
  showWebsite = true,
  legend = "Links",
  hideLegend = false,
  labels,
  className,
  ...props
}: SocialLinksFieldsetProps) {
  const text: Words = { ...DEFAULT_LABELS, ...labels };
  const [own, setOwn] = useState<SocialLinks>(defaultValue ?? {});
  const current = value ?? own;
  /** What is in each field while it is being typed. The value only holds what passed, so the text lives here until it does. */
  const [typing, setTyping] = useState<Record<string, string>>({});
  /** What this fieldset found wrong when a field was left. */
  const [found, setFound] = useState<Record<string, string | undefined>>({});

  function emit(patch: SocialLinks) {
    const next = { ...current, ...patch };
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function flag(id: string, problem: string | undefined) {
    setFound((previous) => ({ ...previous, [id]: problem }));
  }

  function setDraft(id: string, raw: string) {
    setTyping((previous) => ({ ...previous, [id]: raw }));
  }

  /** The text in a field: what is being typed while it still stands for the value, otherwise the value, which came from outside. */
  function shownIn(id: string, out: (raw: string) => string): string {
    const draft = typing[id];
    const stored = current[id] ?? "";
    return draft !== undefined && out(draft) === stored ? draft : stored;
  }

  function handleMessage(network: SocialNetwork, handle: string): string | undefined {
    const problem = checkHandle(network, handle);
    if (problem === "missing") return fill(text.missing, { network: network.label });
    return problem ? (network.message ?? text.invalidHandle) : undefined;
  }

  function editHandle(network: SocialNetwork, raw: string) {
    const handle = toHandle(raw, network.prefix);
    setDraft(network.id, handle);
    emit({ [network.id]: handleOut(network, handle) });
    // Not on every keystroke, but a problem that is on show goes the moment it is fixed.
    if (found[network.id]) flag(network.id, handleMessage(network, handle));
  }

  function leaveHandle(network: SocialNetwork) {
    const shown = shownIn(network.id, (draft) => handleOut(network, draft));
    const handle = toHandle(shown, network.prefix);
    // Text that came in from outside, such as a link or an @, is cut down as well.
    if (handle !== shown) {
      setDraft(network.id, handle);
      emit({ [network.id]: handleOut(network, handle) });
    }
    flag(network.id, handleMessage(network, handle));
  }

  function editWebsite(raw: string) {
    setDraft("website", raw);
    emit({ website: websiteOut(raw) });
    if (found.website) flag("website", toWebsite(raw).valid ? undefined : text.invalidWebsite);
  }

  function leaveWebsite() {
    const shown = shownIn("website", websiteOut);
    const result = toWebsite(shown);
    // The address gets its https:// once the field is left, not while it is typed.
    if (result.valid && result.value !== shown) {
      setDraft("website", result.value);
      emit({ website: result.value });
    }
    flag("website", result.valid ? undefined : text.invalidWebsite);
  }

  const message = (id: string) => errors?.[id] ?? found[id] ?? null;
  const optional = (
    <span className="font-normal text-muted-foreground">
      <span className="sr-only">, </span>
      {text.optional}
    </span>
  );

  return (
    <fieldset data-slot="social-links-fieldset" className={cn("m-0 min-w-0 border-0 p-0", className)} {...props}>
      <legend className={cn("mb-4 p-0 text-base leading-tight font-semibold tracking-[-0.015em]", hideLegend && "sr-only")}>{legend}</legend>
      <div className="grid grid-cols-1 gap-5">
        {showWebsite ? (
          <FormField error={message("website")}>
            <FormLabel>
              {text.website}
              {optional}
            </FormLabel>
            <InputGroup className="overflow-hidden">
              <InputGroupAddon className={CELL}>
                <IconGlobe aria-hidden="true" />
              </InputGroupAddon>
              <FormControl>
                <InputGroupInput
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="kestrel.dev"
                  value={shownIn("website", websiteOut)}
                  onChange={(event) => editWebsite(event.target.value)}
                  onBlur={leaveWebsite}
                  className="placeholder:text-muted-foreground/70"
                />
              </FormControl>
            </InputGroup>
            {/* What the person typed stays in the field; this is the one that is sent, once it has passed. */}
            <input type="hidden" name="website" value={current.website ?? ""} />
          </FormField>
        ) : null}

        {networks.map((network) => (
          <FormField key={network.id} error={message(network.id)} described>
            <FormLabel>
              {network.label}
              {network.required ? null : optional}
            </FormLabel>
            <InputGroup className="overflow-hidden">
              <InputGroupAddon className={cn(CELL, "whitespace-nowrap")}>{network.prefix}</InputGroupAddon>
              <FormControl>
                <InputGroupInput
                  type="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={network.placeholder}
                  required={network.required}
                  value={shownIn(network.id, (draft) => handleOut(network, draft))}
                  onChange={(event) => editHandle(network, event.target.value)}
                  onBlur={() => leaveHandle(network)}
                  className="placeholder:text-muted-foreground/70"
                />
              </FormControl>
            </InputGroup>
            <input type="hidden" name={network.id} value={current[network.id] ?? ""} />
            {/* The prefix is drawn, not read, so the label's description says it. */}
            <FormDescription className="sr-only">{fill(text.hint, { prefix: network.prefix })}</FormDescription>
          </FormField>
        ))}
      </div>
    </fieldset>
  );
}
