import type { ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { KeyboardFeatures, type KeyboardShortcut } from "@rhs-ui/marketing/keyboard-features";
import { Button } from "@rhs-ui/primitives/button";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const SHORTCUTS: KeyboardShortcut[] = [
  { id: "palette", keys: "Mod+K", title: "Open the command palette", description: "Jump to any project, task or setting by typing a few letters." },
  { id: "create", keys: "C", title: "Create a task", description: "From anywhere in the app. Type a name, press Enter, keep going." },
  { id: "projects", keys: "G then P", title: "Go to your projects", description: "Press G, then P. The same pattern reaches your inbox, calendar and settings." },
  { id: "inbox", keys: ["G", "I"], title: "Go to your inbox", description: "Everything assigned to you, newest first, ready to triage." },
  { id: "search", keys: "/", title: "Search everything", description: "Tasks, comments and files, from any screen." },
  { id: "link", keys: "Mod+Shift+L", title: "Copy a link to this task", description: "The short link opens straight into the task for anyone on your team." },
  { id: "edit", keys: "E", title: "Edit the open task", description: "Rename, reschedule or reassign without leaving the keyboard." },
  { id: "send", keys: "Mod+Enter", title: "Comment and close", description: "Post your reply and mark the task done in a single step." },
  { id: "help", keys: "?", title: "Show every shortcut", description: "A cheat sheet that follows you around, one keypress away." },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Nine shortcuts, written for the keyboard this page is opened on. Press any of them while nothing has focus: its card lights up for a second, G then P lights its first key and waits for the second, and a screen reader hears its title. Reduced motion swaps the light-up for an outline">
        <KeyboardFeatures
          title="Everything is a keystroke away"
          description="Kestrel was built for people who would rather not reach for the mouse. Press any of these now and watch its card light up."
          shortcuts={SHORTCUTS}
        />
      </Example>

      <div className="mt-20 border-t border-border pt-12 sm:mt-24">
        <Example caption="The same kind of cards written for a Mac, with an action under them: the modifiers are the symbols printed on the keys, and each carries its spoken name for a screen reader">
          <KeyboardFeatures
            headingLevel={3}
            platform="mac"
            title="On a Mac, it is all within reach of the thumb"
            shortcuts={[
              { id: "palette", keys: "Mod+K", title: "Open the command palette", description: "Jump to any project, task or setting by typing a few letters." },
              { id: "projects", keys: ["G", "P"], title: "Go to your projects", description: "Press G, then P. The same pattern reaches your inbox and calendar." },
              { id: "link", keys: "Mod+Shift+L", title: "Copy a link to this task", description: "The short link opens straight into the task for anyone on your team." },
              { id: "move", keys: "Alt+Up", title: "Move the task up", description: "Reorder a list without dragging anything." },
              { id: "send", keys: "Mod+Enter", title: "Comment and close", description: "Post your reply and mark the task done in a single step." },
              { id: "close", keys: "Esc", title: "Close the open panel", description: "Back to the list, with your place kept." },
            ]}
            cta={
              <Button variant="outline" size="lg">
                See every shortcut
                <IconArrowRight aria-hidden="true" />
              </Button>
            }
          />
        </Example>
      </div>
    </div>
  );
}
