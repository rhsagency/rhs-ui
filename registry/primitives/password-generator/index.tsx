"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { CopyButton } from "@rhs-ui/primitives/copy-button";
import { Label } from "@rhs-ui/primitives/label";
import {
  characterRuns,
  generatePassphrase,
  generatePassword,
  guessTime,
  LOOKALIKES,
  passphraseEntropy,
  passwordEntropy,
  safeLocale,
  strengthOf,
  typicalWordLength,
} from "@rhs-ui/primitives/password-generator/generate";
import { DEFAULT_WORDLIST } from "@rhs-ui/primitives/password-generator/words";
import { Slider } from "@rhs-ui/primitives/slider";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export type PasswordMode = "password" | "passphrase";

export interface PasswordGeneratorProps extends Omit<ComponentProps<"div">, "children" | "defaultValue"> {
  /** Called with the password when "Use this password" is pressed. The button is only there when you give this. */
  onUse?: (password: string) => void;
  /** How long to start: characters for a password (12 to 64, default 20), words for a passphrase (3 to 8, default 6). */
  defaultLength?: number;
  /** Start as a `password` (the default) or a `passphrase`. */
  defaultMode?: PasswordMode;
  /** The words a passphrase is drawn from. Default: a built-in list of over a thousand everyday words, a little more than ten bits each. A longer list is stronger, and the estimate follows the list you give. */
  wordlist?: readonly string[];
  /** The name of the result for a screen reader. Default "Generated password" (or "Generated passphrase"). */
  label?: string;
  /** Writes the numbers in the sentences. Default "en-US". */
  locale?: string;
}

const LIMITS = {
  password: { min: 12, max: 64, fallback: 20, unit: "character" },
  passphrase: { min: 3, max: 8, fallback: 6, unit: "word" },
} as const;

const clamp = (value: number, mode: PasswordMode) => Math.min(LIMITS[mode].max, Math.max(LIMITS[mode].min, Math.round(value)));

interface Settings {
  mode: PasswordMode;
  passwordLength: number;
  passphraseLength: number;
  numbers: boolean;
  symbols: boolean;
  avoidLookalikes: boolean;
  capitalize: boolean;
  addNumber: boolean;
}

function create(settings: Settings, wordlist: readonly string[]): string {
  return settings.mode === "password"
    ? generatePassword({ length: settings.passwordLength, numbers: settings.numbers, symbols: settings.symbols, avoidLookalikes: settings.avoidLookalikes })
    : generatePassphrase({ words: settings.passphraseLength, wordlist, capitalize: settings.capitalize, number: settings.addNumber });
}

/** One row of the options: a name with what it adds, and the switch. */
function Option({ id, label, hint, checked, onCheckedChange }: { id: string; label: string; hint?: string; checked: boolean; onCheckedChange: (checked: boolean) => void }): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="min-w-0 flex-wrap gap-x-2 gap-y-0.5 leading-snug font-normal">
        <span className="font-medium">{label}</span>
        {hint ? <span className="font-mono text-xs text-muted-foreground tabular-nums">{hint}</span> : null}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

/**
 * Makes a strong password or passphrase on demand, in the browser and nowhere
 * else. A password is built from the length and character sets you choose,
 * with every set used at least once; a passphrase is words drawn from a list,
 * with a capital on each and, if you like, a digit. Every character and every
 * word comes from `crypto.getRandomValues` through rejection sampling, so no
 * choice is likelier than another, and nothing is sent, stored or logged. It
 * rates what it made in words ("Would take centuries at a billion guesses a
 * second") from the bits of entropy the settings add up to, copies it, makes a
 * new one, and says each new result once, politely, to a screen reader. It
 * needs nothing from a Password input, so it also serves an admin screen that
 * sets a temporary password. Give `onUse` for a "Use this password" button.
 */
export function PasswordGenerator({ onUse, defaultLength, defaultMode = "password", wordlist = DEFAULT_WORDLIST, label, locale = "en-US", className, ...props }: PasswordGeneratorProps) {
  const base = useId();
  const [settings, setSettings] = useState<Settings>(() => ({
    mode: defaultMode,
    passwordLength: defaultMode === "password" ? clamp(defaultLength ?? LIMITS.password.fallback, "password") : LIMITS.password.fallback,
    passphraseLength: defaultMode === "passphrase" ? clamp(defaultLength ?? LIMITS.passphrase.fallback, "passphrase") : LIMITS.passphrase.fallback,
    numbers: true,
    symbols: true,
    avoidLookalikes: false,
    capitalize: true,
    addNumber: false,
  }));
  // Nothing is made while rendering: on the server it would be a password nobody should use, and in the browser it would not match the server's. It is made once the page is on screen.
  const [result, setResult] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [turns, setTurns] = useState(0);
  const [status, setStatus] = useState("");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    try {
      setResult(create(settings, wordlist));
    } catch {
      setUnavailable(true);
    }
    return () => window.clearTimeout(timer.current);
    // Once, on mount: later results come from what the person changes.
  }, []);

  /** Makes a new result from the settings with the changes in `change`, and says so once the person has stopped. */
  function renew(change: Partial<Settings> = {}) {
    const next = { ...settings, ...change };
    setSettings(next);
    try {
      setResult(create(next, wordlist));
    } catch {
      setUnavailable(true);
      return;
    }
    const passphrase = next.mode === "passphrase";
    const length = passphrase ? next.passphraseLength : next.passwordLength;
    const bits = passphrase ? passphraseEntropy({ words: length, wordlist, number: next.addNumber }) : passwordEntropy({ length, numbers: next.numbers, symbols: next.symbols, avoidLookalikes: next.avoidLookalikes });
    // The region is emptied first, so the same words said twice in a row are still read the second time.
    window.clearTimeout(timer.current);
    setStatus("");
    timer.current = window.setTimeout(
      () => setStatus(`New ${passphrase ? "passphrase" : "password"} ready: ${length} ${LIMITS[next.mode].unit}${length === 1 ? "" : "s"}, ${strengthOf(bits).label.toLowerCase()}.`),
      600,
    );
  }

  const passphrase = settings.mode === "passphrase";
  const length = passphrase ? settings.passphraseLength : settings.passwordLength;
  const limits = LIMITS[settings.mode];
  const bits = passphrase
    ? passphraseEntropy({ words: length, wordlist, number: settings.addNumber })
    : passwordEntropy({ length, numbers: settings.numbers, symbols: settings.symbols, avoidLookalikes: settings.avoidLookalikes });
  const strength = strengthOf(bits);
  const number = new Intl.NumberFormat(safeLocale(locale));
  const runs = result ? characterRuns(result) : [];
  // Words come in different lengths, so a passphrase wraps to a different number of lines each time. An invisible passphrase of typical words keeps the room for it, and the toolbar under it stays where it is. A password has no words: it is broken at any character, so the same length always takes the same lines.
  const typical = useMemo(() => typicalWordLength(wordlist), [wordlist]);
  const room = passphrase ? Array.from({ length: settings.passphraseLength }, () => "x".repeat(typical)).join("-") + (settings.addNumber ? "0" : "") : "";

  return (
    <div data-slot="password-generator" role="group" aria-label="Password generator" className={cn("grid w-full gap-5", className)} {...props}>
      <SegmentedControl
        label="Kind of password"
        value={settings.mode}
        onValueChange={(mode) => renew({ mode: mode as PasswordMode })}
        options={[
          { value: "password", label: "Password" },
          { value: "passphrase", label: "Passphrase" },
        ]}
        className="w-full [&>button]:flex-1"
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <div
          role="textbox"
          tabIndex={result ? 0 : -1}
          aria-readonly="true"
          aria-label={label ?? (passphrase ? "Generated passphrase" : "Generated password")}
          aria-busy={!result && !unavailable ? true : undefined}
          className="grid min-h-[4.25rem] items-center px-4 py-3.5 font-mono text-[1.0625rem] leading-relaxed tracking-[0.01em] text-foreground tabular-nums outline-none select-all focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset"
        >
          {unavailable ? (
            <span className="font-sans text-sm text-destructive">This browser has no secure random source, so no password is made here.</span>
          ) : result ? (
            <span className={cn("col-start-1 row-start-1", passphrase ? "[overflow-wrap:anywhere]" : "[word-break:break-all]")}>
              {runs.map((run, index) => (
                <span key={index} className={cn(run.kind === "digit" && "font-semibold", run.kind === "symbol" && "text-muted-foreground")}>
                  {run.text}
                </span>
              ))}
            </span>
          ) : (
            <span aria-hidden="true" className="col-start-1 row-start-1 text-muted-foreground/40">
              ••••••••••••••••••••
            </span>
          )}
          {room && !unavailable ? (
            <span aria-hidden="true" className="invisible col-start-1 row-start-1 select-none [overflow-wrap:anywhere]">
              {room}
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/40 px-3 py-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={unavailable}
            onClick={() => {
              setTurns((count) => count + 1);
              renew();
            }}
          >
            <IconRefresh aria-hidden="true" className="transition-[rotate] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none" style={{ rotate: `${turns * 180}deg` }} />
            Regenerate
          </Button>
          <CopyButton value={result ?? ""} disabled={!result} />
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center gap-3">
          <div aria-hidden="true" className="grid min-w-0 flex-1 grid-cols-4 gap-1">
            {[1, 2, 3, 4].map((step) => (
              <span key={step} className={cn("h-1.5 rounded-full transition-colors duration-300 motion-reduce:transition-none", step <= strength.level ? "bg-foreground" : "bg-muted")} />
            ))}
          </div>
          <span className="text-xs font-medium whitespace-nowrap">{strength.label}</span>
          <span className="text-xs text-muted-foreground tabular-nums">{number.format(Math.floor(bits))} bits</span>
        </div>
        <p className="text-xs leading-snug text-muted-foreground">{guessTime(bits, { locale })}.</p>
      </div>

      <div className="grid gap-5 border-t border-border pt-5">
        <div className="grid gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-sm leading-none font-medium">{passphrase ? "Number of words" : "Length"}</span>
            <span className="text-sm text-muted-foreground tabular-nums">
              {number.format(length)} {limits.unit}
              {length === 1 ? "" : "s"}
            </span>
          </div>
          <Slider
            min={limits.min}
            max={limits.max}
            step={1}
            value={[length]}
            thumbLabels={[passphrase ? "Number of words" : "Password length"]}
            onValueChange={([next]) => renew(passphrase ? { passphraseLength: clamp(next ?? length, "passphrase") } : { passwordLength: clamp(next ?? length, "password") })}
          />
        </div>
        {passphrase ? (
          <div className="grid gap-4">
            <Option id={`${base}-capitalize`} label="Capitalise words" checked={settings.capitalize} onCheckedChange={(capitalize) => renew({ capitalize })} />
            <Option id={`${base}-number`} label="Add a number" hint="0-9" checked={settings.addNumber} onCheckedChange={(addNumber) => renew({ addNumber })} />
          </div>
        ) : (
          <div className="grid gap-4">
            <Option id={`${base}-numbers`} label="Numbers" hint="0-9" checked={settings.numbers} onCheckedChange={(numbers) => renew({ numbers })} />
            <Option id={`${base}-symbols`} label="Symbols" hint="!@#$%" checked={settings.symbols} onCheckedChange={(symbols) => renew({ symbols })} />
            <Option id={`${base}-lookalikes`} label="Avoid look-alikes" hint={[...LOOKALIKES].join(" ")} checked={settings.avoidLookalikes} onCheckedChange={(avoidLookalikes) => renew({ avoidLookalikes })} />
          </div>
        )}
      </div>

      {onUse ? (
        <Button type="button" disabled={!result} onClick={() => result && onUse(result)} className="w-full">
          Use this {passphrase ? "passphrase" : "password"}
        </Button>
      ) : null}
      <span role="status" className="sr-only">
        {status}
      </span>
    </div>
  );
}
