"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle, IconArrowRight, IconBuilding, IconClose } from "@rhs-ui/icons";
import { cleanWorkspaceDomain, cleanWorkspaceSlug, trimWorkspaceSlug } from "@rhs-ui/application/workspace-url-sign-in/slug";
import { Alert, AlertTitle } from "@rhs-ui/primitives/alert";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** A workspace this device has been used with. */
export interface RecentWorkspace {
  /** The address part: "northwind". It is what `onContinue` receives, and the key of the row. */
  slug: string;
  /** Its name: "Northwind Studio". */
  name: string;
  /** Its logo, as an image address. Without one the tile shows the initials. */
  logo?: string;
}

/** The words the card uses, for translation. `{name}` and `{address}` are filled in. */
export interface WorkspaceUrlSignInLabels {
  /** The heading. Default "Sign in to your workspace". */
  heading?: string;
  /** The line under it. Default "Enter your workspace address to continue.". */
  description?: string;
  /** The field's label. Default "Workspace address". */
  field?: string;
  /** What the empty field shows. Default "acme". */
  placeholder?: string;
  /** The button. Default "Continue". */
  continue?: string;
  /** The button while the address is checked. Default "Checking address". */
  checking?: string;
  /** Under the field when it was left empty. Default "Enter your workspace address.". */
  missing?: string;
  /** Above the field when `onContinue` threw instead of returning a message. Default "We could not check that address. Check your connection and try again.". */
  failed?: string;
  /** The heading of the list of recent workspaces, and its name for screen readers. Default "Recent workspaces". */
  recent?: string;
  /** The name of each row's remove button. Default "Remove {name} from this list". */
  remove?: string;
  /** The question that takes the row's place. Default "Remove {name} from this device?". */
  removeQuestion?: string;
  /** Keeps the workspace in the list. Default "Keep". */
  keep?: string;
  /** Removes it. Default "Remove". */
  removeConfirm?: string;
  /** Above the list when `onRemoveRecent` threw. Default "We could not remove that workspace. Try again.". */
  removeFailed?: string;
  /** The link to the email lookup. Default "Forgot your workspace address?". */
  find?: string;
  /** Said when an address was accepted. Default "Opening {address}.". */
  openingSaid?: string;
  /** Said when a workspace was removed from the list. Default "Removed {name} from this device.". */
  removedSaid?: string;
}

export interface WorkspaceUrlSignInProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** Your product's domain, written after the field: "example.com" shows as ".example.com". */
  domain: string;
  /** Workspaces used on this device, most recent first. Each is a button that skips the typing. */
  recent?: readonly RecentWorkspace[];
  /**
   * Go to the workspace. It receives the address as it will be used, lower case, without the domain. Return a message when there is no such
   * workspace ("There is no workspace at {address}.", where {address} becomes acme.example.com, the address that was tried) and the card shows
   * it against the field, which keeps the address and selects it; return nothing when the address is good, which is where you navigate. A
   * thrown error shows a general message.
   */
  onContinue: (slug: string) => string | void | Promise<string | void>;
  /** The "Forgot your workspace address?" link, which sends the person to an email lookup. Leave it out for no link. */
  onFindWorkspace?: () => void;
  /**
   * Forget a recent workspace on this device, after the person confirmed it in the row. Resolve once it is gone and drop it from `recent`; the
   * focus then goes to the next row. Leave it out and rows have no remove button.
   */
  onRemoveRecent?: (workspace: RecentWorkspace) => void | Promise<void>;
  /** The address the field starts with. */
  defaultSlug?: string;
  /** Start with this message under the field, as it stands after an unknown address: for a preview. Typing clears it. */
  defaultError?: string;
  /** Start with the removal question open on this recent workspace (by slug): for a preview. */
  defaultConfirming?: string;
  /** Under the card: a link to create a workspace, terms. */
  footer?: ReactNode;
  /** The heading's element: "h1" (the default) when the card is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The words the card uses, for translation. */
  labels?: WorkspaceUrlSignInLabels;
}

const DEFAULT_LABELS = {
  heading: "Sign in to your workspace",
  description: "Enter your workspace address to continue.",
  field: "Workspace address",
  placeholder: "acme",
  continue: "Continue",
  checking: "Checking address",
  missing: "Enter your workspace address.",
  failed: "We could not check that address. Check your connection and try again.",
  recent: "Recent workspaces",
  remove: "Remove {name} from this list",
  removeQuestion: "Remove {name} from this device?",
  keep: "Keep",
  removeConfirm: "Remove",
  removeFailed: "We could not remove that workspace. Try again.",
  find: "Forgot your workspace address?",
  openingSaid: "Opening {address}.",
  removedSaid: "Removed {name} from this device.",
} satisfies Required<WorkspaceUrlSignInLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

// InputGroup keeps its neutral focus ring even on an invalid field; an address that was not found keeps its error colour while it is being fixed.
const STAYS_RED = "has-[input[aria-invalid=true]:focus-visible]:border-destructive has-[input[aria-invalid=true]:focus-visible]:ring-destructive/30";

/**
 * The first screen of a product that signs people in per workspace. The field
 * asks for the address and shows your domain after it, as one box, so what
 * the person types is plainly the first part of a web address: it is lower
 * cased and stripped of spaces as it goes, and pasting a whole address leaves
 * just the name. Enter continues. An address that does not exist is announced
 * against the field with the message you return, the address that was tried is
 * kept and selected, and the next try is just typing. Below it, the
 * workspaces already used on this device are buttons that skip the typing;
 * each has a remove button that turns the row into a question, with the safe
 * answer focused, before anything is forgotten, so a shared computer does not
 * keep a list. "Forgot your workspace address?" sends people who do not know
 * it to an email lookup. A busy row shows it is the one being opened.
 */
export function WorkspaceUrlSignIn({
  domain,
  recent = [],
  onContinue,
  onFindWorkspace,
  onRemoveRecent,
  defaultSlug = "",
  defaultError,
  defaultConfirming,
  footer,
  titleAs: Title = "h1",
  labels,
  className,
  ...props
}: WorkspaceUrlSignInProps) {
  const text: Required<WorkspaceUrlSignInLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const host = cleanWorkspaceDomain(domain);
  const Sub = Title === "h1" ? "h2" : Title === "h2" ? "h3" : "h4";
  const field = useRef<HTMLInputElement>(null);
  const rows = useRef(new Map<string, HTMLButtonElement>());
  const removers = useRef(new Map<string, HTMLButtonElement>());
  const keepButton = useRef<HTMLButtonElement>(null);
  const focusKeep = useRef(false);
  const afterRemove = useRef<{ slug: string; index: number } | null>(null);
  const working = useRef(false);
  const [slug, setSlug] = useState(() => cleanWorkspaceSlug(defaultSlug));
  const [error, setError] = useState(defaultError ?? "");
  const [problem, setProblem] = useState("");
  // Which one is being opened: "form" for the button, or the slug of a recent row.
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(defaultConfirming ?? null);
  const [removing, setRemoving] = useState(false);
  const [said, setSaid] = useState({ id: 0, text: "" });

  const say = (message: string) => setSaid((previous) => ({ id: previous.id + 1, text: message }));

  // The question takes the place of the row and the safe answer takes the focus, but only when the person asked for it, never on the first paint of a preview.
  useEffect(() => {
    if (confirming && focusKeep.current) {
      focusKeep.current = false;
      keepButton.current?.focus();
    }
  }, [confirming]);

  // After a removal the workspace is gone from the list: the focus goes to the row that took its place, or the one before it, or the field.
  useEffect(() => {
    const pending = afterRemove.current;
    if (!pending || recent.some((workspace) => workspace.slug === pending.slug)) return;
    afterRemove.current = null;
    const target = recent[Math.min(pending.index, recent.length - 1)];
    (target ? rows.current.get(target.slug) : field.current)?.focus();
  }, [recent]);

  // A question about a workspace that is no longer in the list has nothing left to ask about.
  useEffect(() => {
    if (confirming && !recent.some((workspace) => workspace.slug === confirming)) setConfirming(null);
  }, [recent, confirming]);

  function change(event: ChangeEvent<HTMLInputElement>) {
    const node = event.currentTarget;
    const caret = node.selectionStart ?? node.value.length;
    const clean = cleanWorkspaceSlug(node.value);
    // The field is put right here, before React looks at it, so a key that is dropped does not throw the caret to the end.
    if (node.value !== clean) {
      const before = cleanWorkspaceSlug(node.value.slice(0, caret)).length;
      node.value = clean;
      node.setSelectionRange(before, before);
    }
    setSlug(clean);
    if (error) setError("");
    if (problem) setProblem("");
  }

  async function open(source: string, address: string) {
    if (working.current) return;
    const target = trimWorkspaceSlug(address);
    if (!target) {
      setError(text.missing);
      field.current?.focus();
      return;
    }
    working.current = true;
    setBusy(source);
    setError("");
    setProblem("");
    setSlug(target);
    try {
      const message = await onContinue(target);
      if (message) {
        // The message may carry {address}, which is filled with the address that was tried: "There is no workspace at {address}."
        setError(fill(message, { address: `${target}.${host}` }));
        // The address that was tried stays, selected, so the next try is just typing over it.
        field.current?.focus();
        field.current?.select();
      } else {
        say(fill(text.openingSaid, { address: `${target}.${host}` }));
      }
    } catch {
      setProblem(text.failed);
    } finally {
      working.current = false;
      setBusy(null);
    }
  }

  async function remove(workspace: RecentWorkspace, index: number) {
    if (working.current) return;
    working.current = true;
    setRemoving(true);
    setProblem("");
    // Noted before the call: the list may well change before the promise settles, and the focus has to follow that change.
    afterRemove.current = { slug: workspace.slug, index };
    try {
      await onRemoveRecent?.(workspace);
      setConfirming(null);
      say(fill(text.removedSaid, { name: workspace.name }));
    } catch {
      afterRemove.current = null;
      setProblem(text.removeFailed);
    } finally {
      working.current = false;
      setRemoving(false);
    }
  }

  function stopAsking(workspace: RecentWorkspace) {
    setConfirming(null);
    // The remove button comes back with the row, so the focus goes back to where the question began.
    requestAnimationFrame(() => removers.current.get(workspace.slug)?.focus());
  }

  const formBusy = busy === "form";
  const anyBusy = busy !== null;

  return (
    <div data-slot="workspace-url-sign-in" className={cn("@container mx-auto grid w-full max-w-md gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8", className)} {...props}>
      <div className="grid justify-items-start gap-4">
        <span aria-hidden="true" className="grid size-11 place-items-center rounded-full border border-border bg-muted/60 text-foreground [&_svg]:size-5">
          <IconBuilding />
        </span>
        <div className="grid gap-1.5">
          <Title className="text-xl leading-tight font-semibold tracking-[-0.03em] text-balance">{text.heading}</Title>
          <p className="text-sm leading-relaxed text-muted-foreground">{text.description}</p>
        </div>
      </div>

      <form
        noValidate
        aria-busy={formBusy || undefined}
        onSubmit={(event: FormEvent<HTMLFormElement>) => {
          event.preventDefault();
          void open("form", slug);
        }}
        className="grid gap-4"
      >
        <div role="alert" className="empty:hidden">
          {problem ? (
            <Alert tone="destructive" role="none" className={DANGER_TEXT}>
              <IconAlertCircle />
              <AlertTitle>{problem}</AlertTitle>
            </Alert>
          ) : null}
        </div>

        <FormField error={error}>
          <FormLabel>{text.field}</FormLabel>
          <InputGroup className={cn("h-11 overflow-hidden", STAYS_RED)}>
            <FormControl>
              <InputGroupInput
                ref={field}
                name="workspace"
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                placeholder={text.placeholder}
                value={slug}
                // Read only, not disabled: a disabled field gives up the focus, and the next try should be just typing.
                readOnly={anyBusy}
                onChange={change}
                className="px-3.5 text-[0.9375rem]"
              />
            </FormControl>
            <InputGroupAddon className="border-l border-border bg-muted/50 px-3.5 text-sm tabular-nums last:pl-3.5">{`.${host}`}</InputGroupAddon>
          </InputGroup>
        </FormField>

        <Button type="submit" size="lg" loading={formBusy} aria-disabled={anyBusy && !formBusy ? true : undefined} className="w-full aria-disabled:opacity-60">
          {formBusy ? text.checking : text.continue}
          {formBusy ? null : <IconArrowRight />}
        </Button>
      </form>

      {recent.length > 0 ? (
        <div className="grid gap-3">
          <Sub id={`${id}-recent`} className="flex items-center gap-3 text-xs leading-none font-medium text-muted-foreground after:h-px after:flex-1 after:bg-border">
            {text.recent}
          </Sub>
          <ul aria-labelledby={`${id}-recent`} className="divide-y divide-border overflow-hidden rounded-xl border border-border">
            {recent.map((workspace, index) => {
              const opening = busy === workspace.slug;
              if (confirming === workspace.slug) {
                return (
                  <li key={workspace.slug} className="min-h-16 bg-destructive/5 px-4 py-3">
                    {/* The group is inside the list item, so the list keeps its structure while the row asks. */}
                    <div
                      role="group"
                      aria-label={fill(text.removeQuestion, { name: workspace.name })}
                      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                        if (event.key === "Escape" && !removing) {
                          event.stopPropagation();
                          stopAsking(workspace);
                        }
                      }}
                      className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-2.5"
                    >
                      <p className="min-w-0 flex-1 basis-40 text-sm leading-snug [overflow-wrap:anywhere]">{fill(text.removeQuestion, { name: workspace.name })}</p>
                      <div className="flex gap-2">
                        <Button ref={keepButton} type="button" size="sm" variant="outline" disabled={removing} onClick={() => stopAsking(workspace)}>
                          {text.keep}
                        </Button>
                        <Button type="button" size="sm" variant="destructive" loading={removing} onClick={() => void remove(workspace, index)}>
                          {text.removeConfirm}
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              }
              return (
                <li key={workspace.slug} className={cn("group/row flex min-h-16 items-center transition-colors duration-150 hover:bg-muted/50 focus-within:bg-muted/40 motion-reduce:transition-none", opening && "bg-muted/50")}>
                  <button
                    ref={(element) => {
                      if (element) rows.current.set(workspace.slug, element);
                      else rows.current.delete(workspace.slug);
                    }}
                    type="button"
                    aria-busy={opening || undefined}
                    aria-disabled={(anyBusy && !opening) || undefined}
                    onClick={() => void open(workspace.slug, workspace.slug)}
                    // Without a remove button beside it the row has no neighbour to leave room for, so it gets the same gutter on the right as on the left.
                    className={cn(
                      "flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset aria-busy:cursor-progress aria-disabled:cursor-default aria-disabled:opacity-60",
                      onRemoveRecent ? "pr-2" : "pr-4",
                    )}
                  >
                    <Avatar className="rounded-lg">
                      {workspace.logo ? <AvatarImage src={workspace.logo} alt="" className="rounded-lg" /> : null}
                      <AvatarFallback aria-hidden="true" className="rounded-lg">
                        {initialsOf(workspace.name) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="grid min-w-0 flex-1 gap-0.5">
                      <span className="truncate text-sm leading-snug font-medium">{workspace.name}</span>
                      <span className="truncate text-[0.8125rem] leading-snug text-muted-foreground tabular-nums">{`${workspace.slug}.${host}`}</span>
                    </span>
                    {opening ? (
                      <Spinner size={16} label="" role="presentation" aria-hidden="true" className="text-muted-foreground" />
                    ) : (
                      // The arrow only shows on hover and focus, so in a narrow card (a phone, where it never shows) it would reserve room the address needs.
                      <IconArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground opacity-0 transition-[opacity,transform] duration-150 group-focus-within/row:opacity-100 group-hover/row:translate-x-0.5 group-hover/row:opacity-100 motion-reduce:transition-none @max-[22rem]:hidden" />
                    )}
                  </button>
                  {onRemoveRecent ? (
                    <div className="pr-2">
                      <Button
                        ref={(element) => {
                          if (element) removers.current.set(workspace.slug, element);
                          else removers.current.delete(workspace.slug);
                        }}
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={anyBusy}
                        aria-label={fill(text.remove, { name: workspace.name })}
                        onClick={() => {
                          focusKeep.current = true;
                          setConfirming(workspace.slug);
                        }}
                        className="text-muted-foreground hover:bg-background hover:text-foreground"
                      >
                        <IconClose className="size-4" />
                      </Button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {onFindWorkspace ? (
        <Button type="button" variant="ghost" size="sm" onClick={onFindWorkspace} className="-mt-2 justify-self-center text-muted-foreground hover:text-foreground">
          {text.find}
        </Button>
      ) : null}

      {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}

      <span role="status" className="sr-only">
        <span key={said.id}>{said.text}</span>
      </span>
    </div>
  );
}
