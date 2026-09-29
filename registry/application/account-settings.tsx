"use client";

import { useId, useState, type FormEvent } from "react";

import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export interface AccountProfile {
  name: string;
  email: string;
  language: string;
  avatar?: string;
}

export interface AccountNotification {
  key: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface AccountSettingsProps {
  profile: AccountProfile;
  languages: readonly { value: string; label: string }[];
  notifications: readonly AccountNotification[];
  /** Return (or resolve to) a message to show it as an error; nothing when saved. */
  onSaveProfile: (profile: AccountProfile) => Promise<string | void> | string | void;
  onNotificationChange: (key: string, enabled: boolean) => void;
  onDeleteAccount: () => Promise<void> | void;
  /** The word someone types before the delete button unlocks. */
  confirmWord?: string;
  className?: string;
}

/**
 * An account page in three cards: the profile with a save that only lights
 * up when something changed, notifications that apply at once, and a danger
 * zone whose delete asks for a typed word in a dialog. Every result is
 * announced; nothing is lost on an error.
 */
export function AccountSettings({ profile, languages, notifications, onSaveProfile, onNotificationChange, onDeleteAccount, confirmWord = "delete", className }: AccountSettingsProps) {
  const id = useId();
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(profile);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const dirty = draft.name !== saved.name || draft.email !== saved.email || draft.language !== saved.language;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      const message = await onSaveProfile(draft);
      if (message) setStatus({ tone: "error", text: message });
      else {
        setSaved(draft);
        setStatus({ tone: "ok", text: "Profile saved." });
      }
    } catch {
      setStatus({ tone: "error", text: "Saving failed. Your changes are still here; try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-slot="account-settings" className={cn("grid w-full max-w-2xl gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h2>Profile</h2>
          </CardTitle>
          <CardDescription>How you appear to your team and on invoices.</CardDescription>
        </CardHeader>
        <form onSubmit={save} className="contents">
          <CardContent className="grid gap-5">
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                {draft.avatar ? <AvatarImage src={draft.avatar} alt="" /> : null}
                <AvatarFallback>{initialsOf(draft.name || "?")}</AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">Your initials show until you add a photo.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${id}-name`}>Name</Label>
                <Input id={`${id}-name`} name="name" autoComplete="name" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-email`}>Email</Label>
                <Input id={`${id}-email`} name="email" type="email" autoComplete="email" required value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
              </div>
            </div>
            <div className="grid gap-2 sm:max-w-[calc(50%-0.625rem)]">
              <Label htmlFor={`${id}-language`}>Language</Label>
              <Select value={draft.language} onValueChange={(language) => setDraft({ ...draft, language })}>
                <SelectTrigger id={`${id}-language`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((language) => (
                    <SelectItem key={language.value} value={language.value}>
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="justify-between gap-4 border-t border-border">
            <p role="status" className={cn("text-sm", status?.tone === "error" ? "text-destructive" : "text-muted-foreground")}>
              {status?.text ?? (dirty ? "You have unsaved changes." : "")}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" disabled={!dirty || busy} onClick={() => setDraft(saved)}>
                Discard
              </Button>
              <Button type="submit" disabled={!dirty} loading={busy}>
                Save changes
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle asChild>
            <h2>Notifications</h2>
          </CardTitle>
          <CardDescription>Changes apply straight away.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {notifications.map((item) => (
              <li key={item.key} className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0">
                <div className="grid gap-1">
                  <Label htmlFor={`${id}-${item.key}`}>{item.title}</Label>
                  <p id={`${id}-${item.key}-description`} className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <Switch
                  id={`${id}-${item.key}`}
                  aria-describedby={`${id}-${item.key}-description`}
                  checked={item.enabled}
                  onCheckedChange={(enabled) => onNotificationChange(item.key, enabled)}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle asChild>
            <h2>Delete account</h2>
          </CardTitle>
          <CardDescription>Removes your profile, projects and invoices for good. There is no undo.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Dialog onOpenChange={(open) => !open && setTyped("")}>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>
                  Type <strong className="font-mono text-foreground">{confirmWord}</strong> to confirm. Everything is removed at once.
                </DialogDescription>
              </DialogHeader>
              <Input aria-label={`Type ${confirmWord} to confirm`} value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" spellCheck={false} />
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Keep my account</Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  disabled={typed.trim().toLowerCase() !== confirmWord.toLowerCase()}
                  loading={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    try {
                      await onDeleteAccount();
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  Delete for good
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    </div>
  );
}
