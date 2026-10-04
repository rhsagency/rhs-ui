"use client";

import { useState, type ReactNode } from "react";

import { IconChevronDown, IconClose, IconMenu } from "@rhs-ui/icons";
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export interface MobileMenuGroup {
  label: string;
  /** A direct link, or a group of links that folds open. */
  href?: string;
  links?: readonly { label: string; href: string; description?: string }[];
}

export interface MobileMenuProps {
  brand: ReactNode;
  groups: readonly MobileMenuGroup[];
  /** The buttons at the bottom: sign in, start free. */
  actions?: ReactNode;
  /** The href of the current page, marked with aria-current. */
  current?: string;
  className?: string;
}

/**
 * The phone navigation of a marketing site: a menu button that opens a full
 * screen panel with big tap targets, groups that fold open in place, the
 * current page marked and the main actions pinned to the bottom. A modal
 * dialog, so focus stays inside and Escape closes it.
 */
export function MobileMenu({ brand, groups, actions, current, className }: MobileMenuProps) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  return (
    <Dialog>
      <DialogTrigger aria-label="Open menu" className={cn("inline-flex size-10 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-5", className)}><IconMenu /></DialogTrigger>
      <DialogContent showCloseButton={false} className="top-0 left-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 sm:max-w-none translate-y-0 flex-col gap-0 rounded-none border-0 p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <DialogTitle className="text-base font-medium">{brand}</DialogTitle>
          <DialogClose aria-label="Close menu" className="inline-flex size-10 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-5"><IconClose /></DialogClose>
        </div>
        <nav aria-label="Main" className="relative min-h-0 flex-1 overflow-y-auto px-3 py-4">
          <ul className="grid gap-1">
            {groups.map((group) => {
              const expanded = openGroup === group.label;
              return (
                <li key={group.label}>
                  {group.links?.length ? (
                    <>
                      <button type="button" aria-expanded={expanded} onClick={() => setOpenGroup(expanded ? null : group.label)} className="flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left text-lg font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40">
                        {group.label}
                        <IconChevronDown aria-hidden="true" className={cn("size-5 transition-transform motion-reduce:transition-none", expanded && "rotate-180")} />
                      </button>
                      {expanded ? (
                        <ul className="mb-2 grid gap-0.5 pl-3">
                          {group.links.map((link) => (
                            <li key={`${link.href}-${link.label}`}>
                              <a href={link.href} aria-current={link.href === current ? "page" : undefined} className="block rounded-lg px-3 py-2.5 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:font-medium">
                                <span className="block">{link.label}</span>
                                {link.description ? <span className="block text-sm text-muted-foreground">{link.description}</span> : null}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </>
                  ) : (
                    <a href={group.href} aria-current={group.href === current ? "page" : undefined} className="block rounded-xl px-3 py-3.5 text-lg font-medium outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:underline aria-[current=page]:underline-offset-4">{group.label}</a>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        {actions ? <div className="grid gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] *:w-full">{actions}</div> : null}
      </DialogContent>
    </Dialog>
  );
}
