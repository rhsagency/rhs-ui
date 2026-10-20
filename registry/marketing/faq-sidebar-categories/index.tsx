import type { ComponentProps, ElementType, ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";
import { CategoryNav } from "@rhs-ui/marketing/faq-sidebar-categories/category-nav";
import { CopyLinkButton } from "@rhs-ui/marketing/faq-sidebar-categories/copy-link-button";

export interface FaqQuestion {
  /** Stable and URL-safe: it is the anchor (#id) that support replies and search results link to. */
  id: string;
  question: string;
  /** The answer in full: text, or paragraphs and links. It is always in the page. */
  answer: ReactNode;
}

export interface FaqCategory {
  /** Stable and URL-safe: the category can be linked as #id. */
  id: string;
  title: string;
  questions: readonly FaqQuestion[];
}

export interface FaqContact {
  /** "Still have a question?". */
  title: string;
  description?: string;
  /** The button's text: "Talk to support". */
  label: string;
  href: string;
}

export interface FaqLabels {
  /** The category list's landmark name. */
  categories: string;
  /** Read after each count: "questions". */
  questions: string;
  /** The permalink button's accessible name. */
  copyLink: string;
  /** Said in words after the link was copied. */
  linkCopied: string;
  /** Said when the browser refused to copy. */
  copyFailed: string;
}

export interface FaqSidebarCategoriesProps extends Omit<ComponentProps<"section">, "title"> {
  /** A small line above the title: "Help centre". */
  eyebrow?: string;
  title: string;
  /** The title's element: "h2" (the default) inside a page, "h1" when the FAQ is the page. Categories go one level below it, questions one more. */
  titleAs?: "h1" | "h2";
  description?: string;
  categories: readonly FaqCategory[];
  /** A closing block for readers whose question is not here. */
  contact?: FaqContact;
  /** Called after a permalink was copied, with the question id and the full address. Works inside a Client Component. */
  onCopyLink?: (id: string, url: string) => void;
  /** Renders the contact link. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Replaces any of the fixed words, for another language. */
  labels?: Partial<FaqLabels>;
}

const LABELS: FaqLabels = {
  categories: "Categories",
  questions: "questions",
  copyLink: "Copy link to this answer",
  linkCopied: "Link copied",
  copyFailed: "Copy it from the address bar",
};

const LEVELS = {
  h1: { category: "h2", question: "h3" },
  h2: { category: "h3", question: "h4" },
} as const;

/**
 * A long FAQ on one URL: a sticky list of categories with question counts
 * beside every question and answer, all open. Each question is a heading with
 * a permalink button that updates the hash and confirms in words, and the ids
 * are stable, so links from support replies keep working and the targeted
 * answer is highlighted on arrival. The current category follows the scroll
 * and carries aria-current; below lg the list becomes a scrolling row under
 * the title. Unlike FaqTabs, every answer stays in the DOM, which is what
 * search engines and support teams link to. Set `--sticky-top` (for example
 * `className="[--sticky-top:4rem]"`) to the height of your sticky header.
 */
export function FaqSidebarCategories({
  eyebrow,
  title,
  titleAs: Title = "h2",
  description,
  categories,
  contact,
  onCopyLink,
  linkAs: Link = "a",
  labels,
  className,
  ...props
}: FaqSidebarCategoriesProps) {
  const text = { ...LABELS, ...labels };
  const Category = LEVELS[Title].category;
  const Question = LEVELS[Title].question;
  return (
    <section data-slot="faq-sidebar-categories" className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="max-w-2xl">
        {eyebrow ? <p className="mb-4 text-xs font-medium tracking-[.18em] text-muted-foreground uppercase">{eyebrow}</p> : null}
        <Title className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</Title>
        {description ? <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-x-16 gap-y-10 lg:mt-14 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <CategoryNav items={categories.map((category) => ({ id: category.id, title: category.title, count: category.questions.length }))} label={text.categories} countLabel={text.questions} />
        <div className="min-w-0">
          {categories.map((category) => (
            <section key={category.id} id={category.id} aria-labelledby={`${category.id}-title`} className="scroll-mt-[calc(var(--sticky-top,5rem)_+_1.5rem)] pb-14 last:pb-0">
              <Category id={`${category.id}-title`} className="text-2xl font-semibold tracking-[-.03em] text-balance">
                {category.title}
              </Category>
              <div className="relative isolate mt-6 divide-y divide-border border-y border-border">
                {category.questions.map((question) => (
                  <div
                    key={question.id}
                    id={question.id}
                    className="group/question relative scroll-mt-[calc(var(--sticky-top,5rem)_+_1.5rem)] py-7 before:absolute before:inset-y-0 before:-inset-x-3 before:-z-10 before:rounded-xl before:bg-muted/70 before:opacity-0 before:transition-opacity before:duration-500 target:before:opacity-100 motion-reduce:before:transition-none"
                  >
                    <div className="flex items-start gap-1">
                      <Question className="min-w-0 text-lg leading-snug font-semibold tracking-[-.02em] text-balance">{question.question}</Question>
                      <CopyLinkButton
                        id={question.id}
                        label={text.copyLink}
                        copiedLabel={text.linkCopied}
                        failedLabel={text.copyFailed}
                        onCopy={onCopyLink}
                        className="-mt-1 transition-[opacity,background-color,color] duration-150 motion-reduce:transition-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within/question:opacity-100 [@media(hover:hover)]:group-hover/question:opacity-100 focus-visible:opacity-100"
                      />
                    </div>
                    <div className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_p+p]:mt-3">{question.answer}</div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          {contact ? (
            <aside aria-label={contact.title} className="mt-14 flex flex-wrap items-center justify-between gap-x-8 gap-y-5 rounded-2xl bg-muted/60 p-6 sm:p-8">
              <div className="max-w-md">
                <p className="text-lg font-semibold tracking-[-.02em]">{contact.title}</p>
                {contact.description ? <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{contact.description}</p> : null}
              </div>
              <Button asChild variant="outline" size="lg" className="bg-background">
                <Link href={contact.href}>
                  {contact.label}
                  <IconArrowRight />
                </Link>
              </Button>
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  );
}
