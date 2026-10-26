"use client";

import { useEffect, useId, useState, type ChangeEvent, type ComponentProps, type FocusEvent } from "react";

import { IconAlertCircle, IconExternal } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { InputGroup, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { trackPress, whenReleased } from "@rhs-ui/primitives/url-field/blur-guard";
import { buildUrl, explainUrl, splitScheme, URL_PROTOCOLS, type UrlProtocol } from "@rhs-ui/primitives/url-field/urls";
import { cn } from "@/lib/utils";

export interface UrlFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "name"> {
  /** The whole address, protocol included, or an empty string. */
  value?: string;
  /** The address to start with, when you do not control it. */
  defaultValue?: string;
  /** Called on every change with the one clean URL (protocol, host in lower case, the rest as typed) and whether it can be used. */
  onValueChange?: (url: string, state: { valid: boolean }) => void;
  /** The protocols in the menu. Default https:// and http://. The first is used for a bare domain. */
  protocols?: readonly UrlProtocol[];
  /** Refuse http:// and explain why. Default false. */
  requireHttps?: boolean;
  /** Allow a path, query or fragment after the domain. Pass false to take a bare domain only. Default true. */
  allowPath?: boolean;
  /** The field's name for a plain form submit: the whole URL in a hidden input. */
  name?: string;
}

// The group takes the focus ring when its input has focus; the protocol menu is a button, so it asks for the same ring. An invalid address keeps its error colour through both.
const RING_ON_MENU = "has-[[data-slot=select-trigger]:focus-visible]:border-ring has-[[data-slot=select-trigger]:focus-visible]:ring-[3px] has-[[data-slot=select-trigger]:focus-visible]:ring-ring/40";
const STAYS_RED =
  "has-[input[aria-invalid=true]:focus-visible]:border-destructive has-[input[aria-invalid=true]:focus-visible]:ring-destructive/30 has-[[aria-invalid=true]]:has-[[data-slot=select-trigger]:focus-visible]:border-destructive has-[[aria-invalid=true]]:has-[[data-slot=select-trigger]:focus-visible]:ring-destructive/30";

/**
 * A web address in two parts that behave as one. The protocol is a menu in
 * front of the field (the house select, never the browser's); the field takes
 * the rest. Paste a whole link and the protocol moves into the menu and the
 * remainder stays, type a bare domain and it is reported with https:// in front,
 * and `onValueChange` always hands over one clean URL. On leaving the field it
 * checks that the host has a dot and valid characters and says what is wrong in
 * words. `requireHttps` refuses http:// and explains why (with a button to
 * switch), `allowPath={false}` keeps it to a bare domain. A valid address gets a
 * small link that opens it in a new tab.
 */
export function UrlField({ value, defaultValue = "", onValueChange, protocols = URL_PROTOCOLS, requireHttps = false, allowPath = true, name, form, disabled, className, onBlur, "aria-describedby": describedBy, ...props }: UrlFieldProps) {
  const messageId = useId();
  const first = protocols[0] ?? "https://";
  const rules = { requireHttps, allowPath, protocols };
  const [protocol, setProtocol] = useState<UrlProtocol>(() => splitScheme(value ?? defaultValue, protocols).protocol ?? first);
  const [rest, setRest] = useState(() => {
    const initial = value ?? defaultValue;
    const split = splitScheme(initial, protocols);
    return split.protocol ? split.rest : initial;
  });
  const [synced, setSynced] = useState(value);
  const [error, setError] = useState<string | null>(null);

  // An address that arrives from outside replaces what is typed, unless it is only the clean form of it.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== buildUrl(protocol, rest)) {
      const split = splitScheme(value, protocols);
      setProtocol(split.protocol ?? first);
      setRest(split.protocol ? split.rest : value);
    }
  }

  useEffect(trackPress, []);

  const url = buildUrl(protocol, rest);
  const usable = url !== "" && explainUrl(protocol, rest, rules) === null;

  function report(nextProtocol: UrlProtocol, nextRest: string) {
    const next = buildUrl(nextProtocol, nextRest);
    onValueChange?.(next, { valid: next !== "" && explainUrl(nextProtocol, nextRest, rules) === null });
  }

  function type(event: ChangeEvent<HTMLInputElement>) {
    const split = splitScheme(event.target.value, protocols);
    const nextProtocol = split.protocol ?? protocol;
    const nextRest = split.protocol ? split.rest : event.target.value;
    setProtocol(nextProtocol);
    setRest(nextRest);
    // A message that is already showing follows the typing and goes once the address is right; a new one waits for the field to be left.
    setError((now) => (now === null ? null : explainUrl(nextProtocol, nextRest, rules)));
    report(nextProtocol, nextRest);
  }

  function pick(next: string) {
    const nextProtocol = protocols.find((option) => option === next) ?? first;
    setProtocol(nextProtocol);
    setError((now) => (now === null ? null : explainUrl(nextProtocol, rest, rules)));
    report(nextProtocol, rest);
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    const clean = buildUrl(protocol, rest);
    const tidy = clean ? clean.slice(protocol.length) : "";
    if (tidy !== rest) setRest(tidy);
    whenReleased(() => setError(explainUrl(protocol, tidy, rules)));
  }

  function secure() {
    setProtocol("https://");
    setError(null);
    report("https://", rest);
  }

  return (
    <div data-slot="url-field" className={cn("grid w-full", className)}>
      <InputGroup className={cn(RING_ON_MENU, STAYS_RED)}>
        <Select value={protocol} onValueChange={pick} disabled={disabled}>
          <SelectTrigger
            aria-label="Protocol"
            className="h-full w-auto shrink-0 gap-1 rounded-none rounded-l-[inherit] border-0 border-r border-border bg-muted/50 pr-2 pl-3 text-muted-foreground shadow-none transition-colors duration-150 hover:text-foreground focus-visible:border-border focus-visible:bg-muted focus-visible:ring-0 data-[size=default]:h-full"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {protocols.map((option) => {
              const secureOption = option === "https://";
              return (
                <SelectItem key={option} value={option} disabled={requireHttps && !secureOption} description={secureOption ? "Secure" : requireHttps ? "Not allowed here" : "Not secure"}>
                  {option}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <InputGroupInput
          type="text"
          inputMode="url"
          autoComplete="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          {...props}
          form={form}
          disabled={disabled}
          value={rest}
          onChange={type}
          onBlur={leave}
          aria-invalid={error ? true : undefined}
          aria-describedby={[describedBy, messageId].filter(Boolean).join(" ")}
        />
        {usable && !disabled ? (
          <Button asChild variant="ghost" size="icon-sm" className="mr-0.5 size-7 text-muted-foreground hover:text-foreground">
            <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${url} in a new tab`}>
              <IconExternal />
            </a>
          </Button>
        ) : null}
      </InputGroup>
      <div id={messageId} aria-live="polite">
        {error ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            <span>
              {error}
              {requireHttps && protocol === "http://" ? (
                <>
                  {" "}
                  <button type="button" onClick={secure} className="-mx-0.5 rounded-sm px-0.5 font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
                    Switch to https://
                  </button>
                </>
              ) : null}
            </span>
          </p>
        ) : null}
      </div>
      {name ? <input type="hidden" name={name} form={form} value={url} disabled={disabled} /> : null}
    </div>
  );
}
