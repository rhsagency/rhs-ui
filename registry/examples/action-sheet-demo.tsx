"use client";

import { useState, type ReactNode } from "react";

import { IconBellOff, IconBookmark, IconCamera, IconCrop, IconFlag, IconImage, IconLink, IconMoreHorizontal, IconShare, IconTrash } from "@rhs-ui/icons";
import { ActionSheet, type ActionSheetAction } from "@rhs-ui/primitives/action-sheet";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  const [last, setLast] = useState("Nothing chosen yet");
  const choose = (label: string) => () => setLast(label);
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-x-8 gap-y-6 p-2 sm:p-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <p className="text-xs leading-relaxed text-muted-foreground md:col-span-2">On a phone, held sideways too, the list rises from the bottom edge and a drag on the handle dismisses it. On a screen at least 640px wide and 560px tall the same rows open in a narrow dialog.</p>
      <Section caption="A short list of related actions, with the destructive one last">
        <ProfilePhoto choose={choose} />
      </Section>
      <Section caption="Descriptions, two destructive rows, and one that is off and says why">
        <Feed choose={choose} />
      </Section>
      <p className="text-sm text-muted-foreground md:col-span-2" role="status">
        Last choice: <span className="font-medium text-foreground">{last}</span>
      </p>
    </div>
  );
}

function Section({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function ProfilePhoto({ choose }: { choose: (label: string) => () => void }): React.JSX.Element {
  const actions: readonly ActionSheetAction[] = [
    { label: "Take a photo", icon: <IconCamera />, onSelect: choose("Take a photo") },
    { label: "Choose from library", icon: <IconImage />, onSelect: choose("Choose from library") },
    { label: "Adjust the crop", icon: <IconCrop />, onSelect: choose("Adjust the crop") },
    { label: "Remove photo", icon: <IconTrash />, destructive: true, onSelect: choose("Remove photo") },
  ];
  return (
    <section className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center gap-4">
        <Avatar className="size-16 text-lg">
          <AvatarFallback>MO</AvatarFallback>
        </Avatar>
        <div className="grid min-w-0 gap-0.5">
          <h2 className="truncate text-base font-semibold tracking-[-0.02em]">Mara Okafor</h2>
          <p className="truncate text-sm text-muted-foreground">Support lead, Amsterdam</p>
        </div>
      </div>
      <ActionSheet
        title="Profile photo"
        message="Choose what happens to this photo."
        actions={actions}
        trigger={
          <Button type="button" variant="outline" className="w-fit">
            Change photo
          </Button>
        }
      />
    </section>
  );
}

const POSTS = [
  { id: "p1", initials: "JW", author: "Jonas Weber", when: "2 hours ago", mine: false, text: "Shipped the new pricing page. Thanks to everyone who tested it on a Friday afternoon, you found three bugs we would have found on Monday." },
  { id: "p2", initials: "MO", author: "Mara Okafor", when: "Yesterday", mine: true, text: "Support queue is at 14 open tickets, the lowest since March. Lucas and Priya, thank you for the long weeks." },
  { id: "p3", initials: "AT", author: "Aiko Tanaka", when: "Monday", mine: false, text: "New empty states for the invoice list are in Figma. Short copy, one clear action each." },
] as const;

/** The actions of one post: the same list for everybody, and Delete only for the author. */
function postActions(post: (typeof POSTS)[number], choose: (label: string) => () => void): readonly ActionSheetAction[] {
  return [
    { label: "Save post", description: "Add it to your collection", icon: <IconBookmark />, onSelect: choose("Save post") },
    { label: "Copy link", icon: <IconLink />, onSelect: choose("Copy link") },
    { label: "Share to a channel", icon: <IconShare />, onSelect: choose("Share to a channel") },
    { label: "Mute this thread", icon: <IconBellOff />, onSelect: choose("Mute this thread") },
    { label: "Report post", description: "Tell the moderators what is wrong", icon: <IconFlag />, destructive: true, onSelect: choose("Report post") },
    post.mine
      ? { label: "Delete post", description: "It leaves the channel for everyone", icon: <IconTrash />, destructive: true, onSelect: choose("Delete post") }
      : { label: "Delete post", description: "Only the author can delete a post", icon: <IconTrash />, destructive: true, disabled: true },
  ];
}

function Feed({ choose }: { choose: (label: string) => () => void }): React.JSX.Element {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">#launches</h2>
        <p className="text-xs text-muted-foreground">3 new posts</p>
      </div>
      <ul className="m-0 grid list-none divide-y divide-border p-0">
        {POSTS.map((post) => (
          <li key={post.id} className="grid gap-3 px-5 py-4">
            <div className="flex items-start gap-3">
              <Avatar className="size-9">
                <AvatarFallback>{post.initials}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 gap-0.5">
                <p className="truncate text-sm font-semibold">{post.author}</p>
                <p className="text-xs text-muted-foreground">{post.when}</p>
              </div>
              <ActionSheet
                title="Post options"
                message={`${post.author}, ${post.when.toLowerCase()}`}
                actions={postActions(post, choose)}
                trigger={
                  <Button type="button" variant="ghost" size="icon" aria-label={`Options for the post by ${post.author}`} className="-mt-1 -mr-2 shrink-0">
                    <IconMoreHorizontal />
                  </Button>
                }
              />
            </div>
            <p className="text-sm leading-relaxed">{post.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
