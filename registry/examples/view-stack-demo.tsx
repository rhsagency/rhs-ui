"use client";

import { useState, type ReactNode } from "react";

import { IconBell, IconClock, IconGlobe, IconMail, IconPalette, IconSettings, IconSmartphone } from "@rhs-ui/icons";
import { ViewStack, ViewStackRow, type ViewRegistry } from "@rhs-ui/application/view-stack";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

interface SettingsProps {
  className?: string;
  defaultStack?: string[];
  stack?: string[];
  onStackChange?: (stack: string[]) => void;
}

/** A settings tree with its own state, so each card in the demo is its own app. */
function Settings({ className, defaultStack, stack, onStackChange }: SettingsProps): React.JSX.Element {
  const [digest, setDigest] = useState("daily");
  const [updates, setUpdates] = useState(true);
  const [security, setSecurity] = useState(true);
  const [push, setPush] = useState({ mentions: true, messages: true, comments: false });
  const [days, setDays] = useState("weekdays");
  const [time, setTime] = useState("08:00");
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");
  const pushOn = Object.values(push).filter(Boolean).length;

  const views: ViewRegistry = {
    settings: {
      title: "Settings",
      content: (
        <div className="grid gap-0.5">
          <ViewStackRow to="notifications" icon={<IconBell />} detail={[digest !== "off" ? "Email" : "", pushOn ? "Push" : ""].filter(Boolean).join(", ") || "Off"}>
            Notifications
          </ViewStackRow>
          <ViewStackRow to="appearance" icon={<IconPalette />} detail={label(THEMES, theme)}>
            Appearance
          </ViewStackRow>
          <ViewStackRow to="language" icon={<IconGlobe />} detail={label(LANGUAGES, language)}>
            Language
          </ViewStackRow>
        </div>
      ),
    },
    notifications: {
      title: "Notifications",
      content: (
        <div className="grid gap-0.5">
          <ViewStackRow to="email" icon={<IconMail />} detail={label(DIGESTS, digest)}>
            Email
          </ViewStackRow>
          <ViewStackRow to="push" icon={<IconSmartphone />} detail={pushOn ? `${pushOn} on` : "Off"}>
            Push
          </ViewStackRow>
          <p className="px-2.5 pt-3 pb-1 text-xs text-muted-foreground">Security alerts about your account always reach you by email.</p>
        </div>
      ),
    },
    email: {
      title: "Email",
      content: (
        <div className="grid gap-3">
          <Choices name="Digest" value={digest} onValueChange={setDigest} options={DIGESTS} />
          <div className="grid gap-0.5 border-t border-border pt-2">
            <Toggle title="Product updates" hint="New features and releases" checked={updates} onCheckedChange={setUpdates} />
            <Toggle title="Security alerts" hint="Sign-ins from a new device" checked={security} onCheckedChange={setSecurity} />
            <ViewStackRow to="schedule" icon={<IconClock />} detail={`${label(DAYS, days)}, ${time}`}>
              Schedule
            </ViewStackRow>
          </div>
        </div>
      ),
    },
    schedule: {
      title: "Schedule",
      content: (
        <div className="grid gap-3">
          <Choices name="Send on" value={days} onValueChange={setDays} options={DAYS} />
          <label className="grid gap-1.5 border-t border-border px-2.5 pt-3 pb-1 text-sm font-medium">
            Time of day
            <Input type="time" value={time} onChange={(event) => setTime(event.target.value)} className="w-32" />
          </label>
        </div>
      ),
    },
    push: {
      title: "Push",
      content: (
        <div className="grid gap-0.5">
          <Toggle title="Mentions" hint="When someone writes @you" checked={push.mentions} onCheckedChange={(next) => setPush({ ...push, mentions: next })} />
          <Toggle title="Direct messages" hint="Replies in your inbox" checked={push.messages} onCheckedChange={(next) => setPush({ ...push, messages: next })} />
          <Toggle title="Comments" hint="On projects you follow" checked={push.comments} onCheckedChange={(next) => setPush({ ...push, comments: next })} />
        </div>
      ),
    },
    appearance: { title: "Appearance", content: <Choices name="Theme" value={theme} onValueChange={setTheme} options={THEMES} /> },
    language: { title: "Language", content: <Choices name="Language" value={language} onValueChange={setLanguage} options={LANGUAGES} /> },
  };

  return <ViewStack views={views} defaultStack={defaultStack} stack={stack} onStackChange={onStackChange} className={className} />;
}

const DEEP = ["settings", "notifications", "email"];

export default function Demo(): React.JSX.Element {
  const [stack, setStack] = useState<string[]>(["settings"]);

  return (
    <div className="w-full">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-12">
        <div className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2 md:items-start">
          <Case caption="Rows open views inside one card: Notifications, then Email, then Schedule. Each view slides in, the height follows it, and Back is named after the view it returns to, with focus going back to the row that opened it.">
            <Settings className="max-h-[27rem] rounded-xl border border-border bg-card text-card-foreground shadow-xs" />
          </Case>
          <Case caption="A stack that starts deep, with defaultStack. A view that sits on another shows Back, and the one below stays mounted, so what was typed in it is still there.">
            <Settings defaultStack={DEEP} className="max-h-[27rem] rounded-xl border border-border bg-card text-card-foreground shadow-xs" />
          </Case>
        </div>

        <div className="grid grid-cols-1 gap-x-10 gap-y-10 md:grid-cols-2 md:items-start">
          <Case caption="The same stack in a popover. It resizes with the view on top, so the panel never jumps between a short menu and a long list.">
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <IconSettings aria-hidden="true" />
                    Settings
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" collisionPadding={8} aria-label="Settings" className="w-[min(20rem,calc(100vw-1rem))] p-0">
                  <Settings className="max-h-[min(26rem,var(--radix-popover-content-available-height))]" />
                </PopoverContent>
              </Popover>
            </div>
          </Case>
          <Case caption="Controlled: the stack lives in your state, a URL or a store. Buttons outside can open a view directly or send everything back to the root.">
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setStack(["settings", "notifications", "email", "schedule"])}>
                  Open Schedule
                </Button>
                {/* Not `disabled`: pressing Reset empties the stack and turns it off, and a disabled button would drop the focus it has. */}
                <Button
                  size="sm"
                  variant="ghost"
                  aria-disabled={stack.length === 1 || undefined}
                  onClick={() => {
                    if (stack.length > 1) setStack(["settings"]);
                  }}
                  className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
                >
                  Reset
                </Button>
                <p className="min-w-0 truncate font-mono text-xs text-muted-foreground">{stack.join(" / ")}</p>
              </div>
              <Settings stack={stack} onStackChange={setStack} className="max-h-[27rem] rounded-xl border border-border bg-card text-card-foreground shadow-xs" />
            </div>
          </Case>
        </div>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const DIGESTS: readonly (readonly [string, string, string])[] = [
  ["off", "Off", "Only the mails you ask for"],
  ["daily", "Daily digest", "One mail at your chosen time"],
  ["weekly", "Weekly digest", "Mondays, with the week in numbers"],
];
const DAYS: readonly (readonly [string, string, string])[] = [
  ["every", "Every day", "Including weekends"],
  ["weekdays", "Weekdays", "Monday to Friday"],
  ["monday", "Mondays only", "One mail a week"],
];
const THEMES: readonly (readonly [string, string, string])[] = [
  ["system", "System", "Follows your device"],
  ["light", "Light", "Always light"],
  ["dark", "Dark", "Always dark"],
];
const LANGUAGES: readonly (readonly [string, string, string])[] = [
  ["en", "English", "United Kingdom"],
  ["nl", "Nederlands", "Nederland"],
  ["de", "Deutsch", "Deutschland"],
];

function label(options: readonly (readonly [string, string, string])[], value: string): string {
  return options.find(([key]) => key === value)?.[1] ?? value;
}

function Choices({ name, value, onValueChange, options }: { name: string; value: string; onValueChange: (value: string) => void; options: readonly (readonly [string, string, string])[] }): React.JSX.Element {
  return (
    <RadioGroup aria-label={name} value={value} onValueChange={onValueChange} className="gap-0.5">
      {options.map(([key, text, hint]) => (
        <label key={key} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 transition-colors duration-150 hover:bg-muted", key === value && "bg-muted/60")}>
          <RadioGroupItem value={key} />
          <span className="grid min-w-0 gap-0.5">
            <span className="text-sm leading-tight font-medium">{text}</span>
            <span className="text-xs text-muted-foreground">{hint}</span>
          </span>
        </label>
      ))}
    </RadioGroup>
  );
}

function Toggle({ title, hint, checked, onCheckedChange }: { title: string; hint: string; checked: boolean; onCheckedChange: (checked: boolean) => void }): React.JSX.Element {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 rounded-md px-2.5 py-2 transition-colors duration-150 hover:bg-muted">
      <span className="grid min-w-0 gap-0.5">
        <span className="text-sm leading-tight font-medium">{title}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  );
}
