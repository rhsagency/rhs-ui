"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";

import { IconAlertCircle, IconLock, IconMoreHorizontal, IconUserMinus, IconUserPlus } from "@rhs-ui/icons";
import { Alert, AlertTitle } from "@rhs-ui/primitives/alert";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { ScrollBar } from "@rhs-ui/primitives/scroll-area";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** One account that is remembered on this device. */
export interface ChooserAccount {
  /** A stable identity: an id from your own records, not the address. */
  id: string;
  /** The person's name: "Ana Costa". */
  name: string;
  /** Their address: "ana.costa@northwind.studio". */
  email: string;
  /** Their picture, as an image address. Without one the avatar shows their initials. */
  avatar?: string;
  /** Whether a session is open for it. It is said in words, "Signed in" or "Signed out", and a signed-out account also carries a lock. */
  signedIn?: boolean;
}

/** The words the card uses, for translation. `{name}` and `{email}` are filled in. */
export interface AccountChooserLabels {
  /** The name of the list, for screen readers. Default "Accounts on this device". */
  list?: string;
  /** For an account with an open session. Default "Signed in". */
  signedIn?: string;
  /** For an account without one. Default "Signed out". */
  signedOut?: string;
  /** In place of the state while that row is being chosen. Default "Signing in…". */
  signingIn?: string;
  /** The row under the list. Default "Use another account". */
  useAnother?: string;
  /** The name of each row's menu button. Default "More options for {name}". */
  menu?: string;
  /** The menu's one item. Default "Remove from this device". */
  remove?: string;
  /** The question that takes the row's place. Default "Remove {email} from this device?". */
  removeQuestion?: string;
  /** Keeps the account. Default "Keep". */
  keep?: string;
  /** Removes it. Default "Remove". */
  removeConfirm?: string;
  /** When there are no accounts. Default "No accounts are remembered on this device.". */
  empty?: string;
  /** Above the list when `onChoose` threw. Default "We could not sign you in. Try again.". */
  failed?: string;
  /** Above the list when `onRemove` threw. Default "We could not remove that account. Try again.". */
  removeFailed?: string;
  /** Said when an account was removed. Default "Removed {email} from this device.". */
  removedSaid?: string;
}

export interface AccountChooserProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The accounts remembered on this device, in the order to show them. After six the list scrolls inside the card, so the last row stays in view. */
  accounts: readonly ChooserAccount[];
  /**
   * A row was chosen. Return a promise and that row alone shows a busy state until it settles; a rejection shows a message above the list.
   * A signed-out account usually leads to its password page, a signed-in one straight into the app.
   */
  onChoose: (account: ChooserAccount) => void | Promise<void>;
  /** "Use another account" was pressed. */
  onUseAnother: () => void;
  /**
   * Forgets an account on this device, after the person confirmed it in the row. Resolve once it is gone and drop it from `accounts`; the focus
   * then goes to the next row. Leave it out and rows have no menu.
   */
  onRemove?: (account: ChooserAccount) => void | Promise<void>;
  /** The heading. Default "Choose an account". */
  title?: ReactNode;
  /** The line under it. Default "Pick one to continue, or use another account.". */
  description?: ReactNode;
  /** Start with the removal question open on this account (by id): for a preview. */
  defaultConfirming?: string;
  /** Under the card's list: terms, a link to help. */
  footer?: ReactNode;
  /** The heading's element: "h1" (the default) when the card is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The words the card uses, for translation. */
  labels?: AccountChooserLabels;
}

const DEFAULT_LABELS = {
  list: "Accounts on this device",
  signedIn: "Signed in",
  signedOut: "Signed out",
  signingIn: "Signing in…",
  useAnother: "Use another account",
  menu: "More options for {name}",
  remove: "Remove from this device",
  removeQuestion: "Remove {email} from this device?",
  keep: "Keep",
  removeConfirm: "Remove",
  empty: "No accounts are remembered on this device.",
  failed: "We could not sign you in. Try again.",
  removeFailed: "We could not remove that account. Try again.",
  removedSaid: "Removed {email} from this device.",
} satisfies Required<AccountChooserLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/**
 * A row is 4rem high, and the list shows six and a half before it scrolls, so the next one peeks out and says there is more; the slim scrollbar,
 * which is there whenever the list overflows and not only on hover, says so as well. The viewport is built from the Radix parts and not taken from
 * the ScrollArea primitive: that one is a Tab stop of its own in front of the first row, with a focus ring the rounded border clips, while the rows
 * take the focus themselves and the browser scrolls the list as the keyboard walks it. Its inner box is a block, not the table Radix makes of it,
 * so the rows keep the width of the card.
 */
const VIEWPORT = "max-h-[26.5rem] w-full rounded-[inherit] [&>div]:block!";

/**
 * "Choose an account": the people already known on this device, so nobody
 * retypes an address they have used a hundred times. Every row is one plain
 * button with an avatar, the name, the address and a word for its state,
 * "Signed in" or "Signed out" with a lock, so state never rests on colour; it
 * has its own menu button beside it, so Tab simply walks the list and there are
 * no composite-widget keyboard rules to learn. Choosing a row shows a busy
 * state on that row alone. "Remove from this device" sits in the row's menu and
 * turns the row into a question with the safe answer focused, before anything
 * happens. After six accounts the list scrolls inside the card, and "Use
 * another account" stays under it, in view.
 */
export function AccountChooser({
  accounts,
  onChoose,
  onUseAnother,
  onRemove,
  defaultConfirming,
  title = "Choose an account",
  description = "Pick one to continue, or use another account.",
  footer,
  titleAs: Title = "h1",
  labels,
  className,
  ...props
}: AccountChooserProps) {
  const text: Required<AccountChooserLabels> = { ...DEFAULT_LABELS, ...labels };
  const rows = useRef(new Map<string, HTMLButtonElement>());
  const menus = useRef(new Map<string, HTMLButtonElement>());
  const keepButton = useRef<HTMLButtonElement>(null);
  const useAnotherButton = useRef<HTMLButtonElement>(null);
  const asking = useRef(false);
  const focusKeep = useRef(false);
  const afterRemove = useRef<{ id: string; index: number } | null>(null);
  const working = useRef(false);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(defaultConfirming ?? null);
  const [removing, setRemoving] = useState(false);
  const [problem, setProblem] = useState("");
  const [said, setSaid] = useState({ id: 0, text: "" });

  // The question takes the place of the row, and the safe answer takes the focus; but only when the person asked it, never on the first paint
  // of a preview that starts with the question open (that would steal the focus and scroll the page to the card).
  useEffect(() => {
    if (confirming && focusKeep.current) {
      focusKeep.current = false;
      keepButton.current?.focus();
    }
  }, [confirming]);

  // After a removal the account is gone from the list: the focus goes to the row that took its place, or to the one before it, or to "Use another".
  useEffect(() => {
    const pending = afterRemove.current;
    if (!pending || accounts.some((account) => account.id === pending.id)) return;
    afterRemove.current = null;
    const target = accounts[Math.min(pending.index, accounts.length - 1)];
    (target ? rows.current.get(target.id) : useAnotherButton.current)?.focus();
  }, [accounts]);

  // A question about an account that is no longer in the list (another tab removed it, the parent dropped it) has nothing left to ask about.
  useEffect(() => {
    if (confirming && !accounts.some((account) => account.id === confirming)) setConfirming(null);
  }, [accounts, confirming]);

  const say = (message: string) => setSaid((previous) => ({ id: previous.id + 1, text: message }));

  async function choose(account: ChooserAccount) {
    if (working.current) return;
    working.current = true;
    setChoosing(account.id);
    setProblem("");
    try {
      await onChoose(account);
    } catch {
      setProblem(text.failed);
    } finally {
      working.current = false;
      setChoosing(null);
    }
  }

  async function remove(account: ChooserAccount, index: number) {
    if (working.current) return;
    working.current = true;
    setRemoving(true);
    setProblem("");
    // Noted before the call: the list may well change before the promise settles, and the focus has to follow that change.
    afterRemove.current = { id: account.id, index };
    try {
      await onRemove?.(account);
      setConfirming(null);
      say(fill(text.removedSaid, { email: account.email }));
    } catch {
      afterRemove.current = null;
      setProblem(text.removeFailed);
    } finally {
      working.current = false;
      setRemoving(false);
    }
  }

  function stopAsking(account: ChooserAccount) {
    setConfirming(null);
    // The menu button comes back with the row, so the focus goes back to where the question began.
    requestAnimationFrame(() => menus.current.get(account.id)?.focus());
  }

  const rowShape = "flex min-h-16 items-center";

  return (
    <div data-slot="account-chooser" className={cn("@container mx-auto grid w-full max-w-md gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs sm:p-8", className)} {...props}>
      <div className="grid gap-1.5">
        <Title className="text-xl leading-tight font-semibold tracking-[-0.03em] text-balance">{title}</Title>
        {description ? <p className="text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>

      <div role="alert" className="-mb-2 empty:hidden">
        {problem ? (
          <Alert tone="destructive" role="none" className={DANGER_TEXT}>
            <IconAlertCircle />
            <AlertTitle>{problem}</AlertTitle>
          </Alert>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {accounts.length > 0 ? (
          <ScrollAreaPrimitive.Root type="auto" className="relative overflow-hidden">
            <ScrollAreaPrimitive.Viewport className={VIEWPORT}>
              <ul aria-label={text.list} className="divide-y divide-border">
                {accounts.map((account, index) => {
                  const isChoosing = choosing === account.id;
                  if (confirming === account.id) {
                    return (
                      <li key={account.id} className={cn(rowShape, "bg-destructive/5 px-4 py-3")}>
                        {/* The group is inside the list item, so the list keeps its structure while the row asks. */}
                        <div
                          role="group"
                          aria-label={fill(text.removeQuestion, { email: account.email })}
                          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                            if (event.key === "Escape" && !removing) {
                              event.stopPropagation();
                              stopAsking(account);
                            }
                          }}
                          className="flex w-full flex-wrap items-center gap-x-4 gap-y-2.5"
                        >
                          <p className="min-w-0 flex-1 basis-40 text-sm leading-snug [overflow-wrap:anywhere]">{fill(text.removeQuestion, { email: account.email })}</p>
                          <div className="flex gap-2">
                            <Button ref={keepButton} type="button" size="sm" variant="outline" disabled={removing} onClick={() => stopAsking(account)}>
                              {text.keep}
                            </Button>
                            <Button type="button" size="sm" variant="destructive" loading={removing} onClick={() => void remove(account, index)}>
                              {text.removeConfirm}
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  }
                  return (
                    <li key={account.id} className={cn(rowShape, "group/row transition-colors duration-150 hover:bg-muted/50 focus-within:bg-muted/40 motion-reduce:transition-none", isChoosing && "bg-muted/50")}>
                      <button
                        ref={(element) => {
                          if (element) rows.current.set(account.id, element);
                          else rows.current.delete(account.id);
                        }}
                        type="button"
                        aria-busy={isChoosing || undefined}
                        onClick={() => void choose(account)}
                        // Without a menu button beside it the row has no neighbour to leave room for, so it gets the same gutter on the right as on the left.
                        className={cn(
                          "flex min-h-16 min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset aria-busy:cursor-progress",
                          onRemove ? "pr-2" : "pr-4",
                        )}
                      >
                        <Avatar>
                          {account.avatar ? <AvatarImage src={account.avatar} alt="" /> : null}
                          <AvatarFallback aria-hidden="true">{initialsOf(account.name) || "?"}</AvatarFallback>
                        </Avatar>
                        {/* The name and the state share a line while the card is wide; in a narrow one the state drops under the address, so the name keeps the whole width. */}
                        <span className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 @max-2xs:grid-cols-[minmax(0,1fr)]">
                          <span className="truncate text-sm leading-snug font-medium">{account.name}</span>
                          <span className={cn("flex items-center gap-1 text-xs leading-snug @max-2xs:order-last", account.signedIn || isChoosing ? "font-medium text-foreground" : "text-muted-foreground")}>
                            {isChoosing ? (
                              <>
                                <Spinner size={12} label="" role="presentation" aria-hidden="true" />
                                {text.signingIn}
                              </>
                            ) : account.signedIn ? (
                              text.signedIn
                            ) : (
                              <>
                                <IconLock aria-hidden="true" className="size-3" />
                                {text.signedOut}
                              </>
                            )}
                          </span>
                          <span className="col-span-2 truncate text-[0.8125rem] leading-snug text-muted-foreground @max-2xs:col-span-1">{account.email}</span>
                        </span>
                      </button>
                      {onRemove ? (
                        <div className="pr-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                ref={(element) => {
                                  if (element) menus.current.set(account.id, element);
                                  else menus.current.delete(account.id);
                                }}
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                disabled={choosing !== null}
                                aria-label={fill(text.menu, { name: account.name })}
                                className="text-muted-foreground hover:bg-background hover:text-foreground"
                              >
                                <IconMoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              // When the item was chosen the row becomes a question, and the focus belongs on its safe answer, not back on a button that is gone.
                              onCloseAutoFocus={(event) => {
                                if (asking.current) {
                                  event.preventDefault();
                                  asking.current = false;
                                }
                              }}
                            >
                              <DropdownMenuItem
                                onSelect={() => {
                                  asking.current = true;
                                  focusKeep.current = true;
                                  setConfirming(account.id);
                                }}
                              >
                                <IconUserMinus />
                                {text.remove}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </ScrollAreaPrimitive.Viewport>
            {/* A thumb a little darker than the primitive's, so the cue reads against the rows on both themes. */}
            <ScrollBar className="[&>[data-slot=scroll-area-thumb]]:bg-muted-foreground/35 [&>[data-slot=scroll-area-thumb]]:hover:bg-muted-foreground/55" />
          </ScrollAreaPrimitive.Root>
        ) : (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">{text.empty}</p>
        )}

        <button
          ref={useAnotherButton}
          type="button"
          onClick={onUseAnother}
          className={cn(rowShape, "w-full gap-3 border-t border-border px-4 py-2.5 text-left text-sm font-medium outline-none hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset")}
        >
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full border border-dashed border-muted-foreground/60 text-muted-foreground">
            <IconUserPlus className="size-4" />
          </span>
          {text.useAnother}
        </button>
      </div>

      {footer ? <div className="border-t border-border pt-5 text-center text-sm text-muted-foreground">{footer}</div> : null}

      <span role="status" className="sr-only">
        <span key={said.id}>{said.text}</span>
      </span>
    </div>
  );
}
