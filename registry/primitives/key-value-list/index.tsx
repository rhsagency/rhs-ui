import type { ComponentProps, ReactNode } from "react";

import { IconArrowUpRight } from "@rhs-ui/icons";
import { CopyButton } from "@rhs-ui/primitives/copy-button";
import { MaskedValue, type MaskedValueProps } from "@rhs-ui/primitives/masked-value";
import { MiddleTruncate } from "@rhs-ui/primitives/middle-truncate";
import { cn } from "@/lib/utils";

export interface KeyValueItem {
  /** What the fact is: "Order id". It is the term of the row, and it names the copy and reveal buttons. */
  label: string;
  /** The value. A string is set in the row and cut in the middle when it does not fit; any other node is drawn as it is. */
  value: ReactNode;
  /** Add a copy button. The text copied is `value` when that is a string, or `copyValue`. */
  copyable?: boolean;
  /** What the copy button puts on the clipboard, when it is not the value shown. */
  copyValue?: string;
  /** Set the value in the mono face: ids, hashes, URLs, anything people compare character by character. */
  mono?: boolean;
  /** Keep the value hidden until a reveal button is pressed. The row's markup holds only the dots while it is hidden. A secret needs a string value: with any other node the row stays dots with no reveal button, and development says so in the console. */
  secret?: boolean;
  /** Make the value a link. It is underlined, so it reads as one without a hover; a link to another site (`https://`) also gets a small arrow. */
  href?: string;
  /** How many characters stay visible at the end of a cut value. Default: a file extension and a few characters before it, otherwise eight. */
  tail?: number;
}

/** The words the list says on its own, for another language or your own wording. `{label}` is the label of the row. */
export interface KeyValueListLabels {
  /** The name of a copy button. Default "Copy {label}". */
  copy: string;
  /** What the button says for a moment after copying, and what a screen reader hears. Default "Copied {label}". */
  copied: string;
  /** The words of a secret's reveal button and its announcements, as `MaskedValue` takes them. */
  mask?: MaskedValueProps["labels"];
}

export interface KeyValueListProps extends Omit<ComponentProps<"dl">, "children"> {
  /** The facts, in order. */
  items: readonly KeyValueItem[];
  /** `stacked` puts each label above its value, for a narrow card. `columns` puts the labels in a column of their own beside the values, when the list has 28rem of room or more; narrower it stacks. A `columns` list measures its own width, so give it a box with one (a block parent or `w-full`): in a shrink-wrapped box it has none to measure. Default "stacked". */
  layout?: "stacked" | "columns";
  /** After this many seconds a revealed secret hides again. A thin ring counts the time down. 0 keeps it shown until it is hidden by hand. Default 30. */
  hideSecretsAfter?: number;
  /** The words the list says, for translation. */
  labels?: Partial<KeyValueListLabels>;
}

const fill = (template: string, label: string) => template.replace("{label}", label);

/** A link to another site: `https://`, `http://` or `//`. The ones that stay on the site, a hash or a path, get no arrow. */
const EXTERNAL = /^(?:https?:)?\/\//i;

/** "Order ID" becomes "order ID" and "Webhook secret" becomes "webhook secret", so a button reads "Copy order ID" in a sentence; an acronym that opens the label ("API key") keeps its capitals. */
function inSentence(label: string): string {
  const first = label.split(/\s+/)[0] ?? "";
  return first.length > 1 && first === first.toUpperCase() ? label : label.charAt(0).toLowerCase() + label.slice(1);
}

/**
 * The facts people copy rather than read: an order id, an endpoint URL, a webhook secret, a checksum. It is the
 * same `dl` markup as the description list, so a screen reader hears the same terms and values, with what those facts
 * need added. Ids, URLs and hashes can be set in mono; every copyable row has a copy button that confirms with a check and
 * a polite "Copied order id"; a secret stays dots until a reveal button is pressed and hides itself again; and a value
 * that is too long for its row gives up its middle, so the start and the end that identify it stay, with the whole value
 * in a tooltip and in the text a screen reader reads. A value can be a link: it is underlined at rest, and a link to another
 * site carries a small arrow. It renders on the server and takes plain data.
 */
export function KeyValueList({ items, layout = "stacked", hideSecretsAfter = 30, labels, className, ...props }: KeyValueListProps) {
  const words = { copy: "Copy {label}", copied: "Copied {label}", ...labels };
  return (
    // Only the columns layout asks its own width a question (28rem or more?). The stacked list needs no container, and one would size it to nothing in a shrink-wrapped parent.
    <dl data-slot="key-value-list" data-layout={layout} className={cn(layout === "columns" && "@container", "w-full min-w-0 text-sm", className)} {...props}>
      {items.map((item, index) => {
        const text = typeof item.value === "string" ? item.value : undefined;
        const toCopy = item.copyValue ?? text;
        const name = inSentence(item.label);
        if (item.secret && text === undefined && process.env.NODE_ENV !== "production") {
          console.error(`KeyValueList: "${item.label}" is a secret but its value is not a string, so it stays hidden with no reveal button. Pass the value as a string.`);
        }
        const shown = item.secret ? (
          // A secret that is not a string is never drawn: it stays dots with nothing to press, instead of falling through to the node in the clear.
          <MaskedValue
            value={text ?? ""}
            revealable={text !== undefined}
            label={name}
            mask="full"
            autoHideAfter={hideSecretsAfter > 0 ? hideSecretsAfter : undefined}
            labels={words.mask}
            className={cn("min-w-0", item.mono && "font-mono text-[0.8125rem]")}
          />
        ) : text !== undefined ? (
          <MiddleTruncate text={text} tail={item.tail} className={cn(item.mono ? "font-mono text-[0.8125rem]" : "font-medium")} />
        ) : (
          item.value
        );
        return (
          <div
            key={`${index}-${item.label}`}
            className={cn(
              "grid gap-x-6 gap-y-1 border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0",
              layout === "columns" && "@md:grid-cols-[minmax(7rem,12rem)_minmax(0,1fr)] @md:items-center",
            )}
          >
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="flex min-w-0 items-center gap-1 text-foreground">
              <span className="flex min-w-0 flex-1 items-center">
                {item.href && !item.secret ? (
                  // Underlined at rest: a link that only shows itself on hover cannot be told from text, and it is a tab stop.
                  <a
                    href={item.href}
                    className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-sm underline decoration-muted-foreground/50 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  >
                    {shown}
                    {EXTERNAL.test(item.href) ? <IconArrowUpRight aria-hidden="true" size={12} className="shrink-0 text-muted-foreground" /> : null}
                  </a>
                ) : (
                  shown
                )}
              </span>
              {item.copyable && toCopy !== undefined ? (
                <CopyButton
                  iconOnly
                  size="sm"
                  variant="ghost"
                  value={toCopy}
                  label={fill(words.copy, name)}
                  copiedLabel={fill(words.copied, name)}
                  className="-my-1 -mr-1.5 text-muted-foreground hover:text-foreground"
                />
              ) : null}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
