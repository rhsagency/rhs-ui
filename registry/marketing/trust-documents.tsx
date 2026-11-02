"use client";

import { useEffect, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconDownload, IconLock } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { cn } from "@/lib/utils";

/** public: anyone can download it. request: it goes out after a short request, usually under an NDA. */
export type TrustDocumentAccess = "public" | "request";

export interface TrustDocument {
  /** A stable id for the document. It keys the row and is what onRequest receives, so it must be unique. */
  id: string;
  /** What the document is called as a buyer asks for it: "SOC 2 Type II report". */
  title: string;
  /** One line on what is inside and who it is for. */
  description?: string;
  /** The file type: "PDF", "XLSX". It is written on the row's tile and in the download link's name. */
  format: string;
  /** The size as people say it: "2.4 MB". It is part of the download link's name. */
  size: string;
  /** The date it applies to, as an ISO date: the end of the audit period, or the day the version took effect. */
  updatedAt: string;
  /** Whether it is a download or a request. */
  access: TrustDocumentAccess;
  /** The file, for a public document. A document on request needs none: you send it after you have looked at the request. */
  href?: string;
}

export interface TrustRequestDetails {
  /** The trimmed work email the document should go to. */
  email: string;
  /** The trimmed name of the company that is asking. */
  company: string;
}

export interface TrustContact {
  /** The line before the link: "Looking for something that is not here?". Falls back to labels.contactText. */
  text?: string;
  /** The link's text, usually the address: "security@northwind.example". */
  label: string;
  /** Where it goes: a mailto: link or a contact page. */
  href: string;
}

export interface TrustDocumentsLabels {
  /** The words before the date. */
  updated: string;
  /** The visible words of a download link. The title, type and size follow, for screen readers. */
  download: string;
  /** The visible words of the button that opens the request. */
  request: string;
  /** The words on that button once a request was sent. */
  requested: string;
  /** The accessible name of the request button. {title} stands for the document. */
  requestFor: string;
  /** The accessible name of the button after the request was sent. {title} stands for the document. */
  requestedFor: string;
  /** The mark on a document that goes out on request. */
  onRequest: string;
  /** The dialog's title. {title} stands for the document. */
  dialogTitle: string;
  /** What the dialog says about who sees the request and when they answer. */
  dialogText: string;
  /** The email field's label. */
  email: string;
  /** The email field's placeholder. */
  emailPlaceholder: string;
  /** The company field's label. */
  company: string;
  /** The company field's placeholder. */
  companyPlaceholder: string;
  /** The button that sends the request. */
  submit: string;
  /** The button that closes the dialog without sending. */
  cancel: string;
  /** The button that closes the confirmation. */
  close: string;
  /** Said under the email field when it is empty. */
  emailRequired: string;
  /** Said under the email field when it is not an address. */
  emailInvalid: string;
  /** Said under the company field when it is empty. */
  companyRequired: string;
  /** Said when onRequest fails. Everything typed stays where it is. */
  failed: string;
  /** The words before the contact link in that message. */
  orWrite: string;
  /** The confirmation's title. */
  doneTitle: string;
  /** What happens next. {email} stands for the address that will be written to. */
  done: string;
  /** The line before the contact link under the list, when `contact.text` is left out. */
  contactText: string;
  /** Said when there are no documents. */
  empty: string;
}

export interface TrustDocumentsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Trust center". */
  eyebrow?: string;
  /** The heading: "The documents your security review asks for". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The documents, in the order you want them shown. */
  documents: readonly TrustDocument[];
  /**
   * Called with the document's id and the checked details when someone asks for a document on request. Resolve to
   * confirm; reject to show the error and keep what was typed. Nothing is sent by the block itself.
   */
  onRequest: (documentId: string, details: TrustRequestDetails) => Promise<void> | void;
  /** Where to write about anything else, and when a request will not go through. */
  contact?: TrustContact;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<TrustDocumentsLabels>;
  /** Locale for the dates. */
  locale?: string;
  /** Time zone for an updatedAt that carries a time; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: TrustDocumentsLabels = {
  updated: "Updated",
  download: "Download",
  request: "Request access",
  requested: "Requested",
  requestFor: "Request access to {title}",
  requestedFor: "Access to {title} requested",
  onRequest: "On request",
  dialogTitle: "Request access to {title}",
  dialogText: "We share this under NDA. Tell us who is asking and we will reply within one business day.",
  email: "Work email",
  emailPlaceholder: "you@company.com",
  company: "Company",
  companyPlaceholder: "Acme Logistics",
  submit: "Send request",
  cancel: "Cancel",
  close: "Close",
  emailRequired: "Enter your work email so we know where to send it.",
  emailInvalid: "That does not look like an email address. Try name@company.com.",
  companyRequired: "Enter the name of your company.",
  failed: "Your request did not go through. Nothing is lost: it is all still here, so try again.",
  orWrite: "Or write to",
  doneTitle: "Request sent",
  done: "We will write to {email} within one business day with the next steps.",
  contactText: "Looking for something that is not here?",
  empty: "There are no documents to show yet.",
};

const ADDRESS = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(value: string, locale: string, timeZone: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
}

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

/** The action is as wide as a phone, as wide as its words between a phone and a wide block (never narrower than the other kind), and as wide as its column on a wide one, so the buttons line up. */
const ACTION = "w-full @xl:w-auto @xl:min-w-36 @3xl:w-full @3xl:min-w-0";

const LINK =
  "rounded-sm font-medium text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

interface RequestFormProps {
  doc: TrustDocument;
  onRequest: TrustDocumentsProps["onRequest"];
  /** The address the request went to, once it was sent. The dialog then shows the confirmation. */
  sentTo: string | undefined;
  onSent: (documentId: string, email: string) => void;
  /** Called with true while a request is on its way and with false when it is answered. */
  onBusyChange: (busy: boolean) => void;
  contact: TrustContact | undefined;
  labels: TrustDocumentsLabels;
}

/** The dialog's body: the two fields while there is something to send, the confirmation after it was sent. */
function RequestForm({ doc, onRequest, sentTo, onSent, onBusyChange, contact, labels }: RequestFormProps): React.JSX.Element {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [touched, setTouched] = useState({ email: false, company: false });
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "busy" | "error">("idle");
  // Focus only moves for something the reader did, never because the dialog opened on a document that was already requested.
  const acted = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sentTo && acted.current) doneRef.current?.focus();
  }, [sentTo]);
  useEffect(() => {
    // Sending disables the button, and a disabled button loses focus; after a failure it is the retry, so the reader lands on it.
    if (status === "error" && acted.current) submitRef.current?.focus();
  }, [status]);

  if (sentTo) {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="grid justify-items-start gap-4 outline-none">
        <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
          <IconCheck size={20} strokeWidth={2.25} />
        </span>
        <DialogHeader>
          <DialogTitle className="text-lg tracking-[-0.02em]">{labels.doneTitle}</DialogTitle>
          <DialogDescription className="text-[0.9375rem] leading-relaxed">
            {fill(labels.done, { email: <strong className="font-medium break-words text-foreground">{sentTo}</strong> })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="w-full">
          <DialogClose asChild>
            <Button type="button">{labels.close}</Button>
          </DialogClose>
        </DialogFooter>
      </div>
    );
  }

  const problems = {
    email: !email.trim() ? labels.emailRequired : !ADDRESS.test(email.trim()) ? labels.emailInvalid : undefined,
    company: !company.trim() ? labels.companyRequired : undefined,
  };
  /** A mistake is only shown once the reader has been in that field or has tried to send. */
  const shown = (field: "email" | "company") => (submitted || touched[field] ? problems[field] : undefined);
  const busy = status === "busy";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    acted.current = true;
    setSubmitted(true);
    if (problems.email) return void emailRef.current?.focus();
    if (problems.company) return void companyRef.current?.focus();
    setStatus("busy");
    onBusyChange(true);
    const details = { email: email.trim(), company: company.trim() };
    try {
      await onRequest(doc.id, details);
      onSent(doc.id, details.email);
    } catch {
      setStatus("error");
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} aria-busy={busy || undefined} className="grid gap-5">
      <DialogHeader className="pr-8">
        <DialogTitle className="text-lg leading-snug tracking-[-0.02em]">{labels.dialogTitle.replace("{title}", doc.title)}</DialogTitle>
        <DialogDescription className="text-[0.9375rem] leading-relaxed">{labels.dialogText}</DialogDescription>
      </DialogHeader>

      {status === "error" ? (
        <p role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/8 px-3.5 py-3 text-sm leading-relaxed">
          <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
          <span className="min-w-0">
            {labels.failed}
            {contact ? (
              <>
                {" "}
                {labels.orWrite}{" "}
                <a href={contact.href} className={LINK}>
                  {contact.label}
                </a>
                .
              </>
            ) : null}
          </span>
        </p>
      ) : null}

      <FormField className="content-start" error={shown("email")}>
        <FormLabel>{labels.email}</FormLabel>
        <FormControl>
          <Input
            ref={emailRef}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            aria-required="true"
            placeholder={labels.emailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, email: true }))}
          />
        </FormControl>
      </FormField>

      <FormField className="content-start" error={shown("company")}>
        <FormLabel>{labels.company}</FormLabel>
        <FormControl>
          <Input
            ref={companyRef}
            name="company"
            autoComplete="organization"
            aria-required="true"
            placeholder={labels.companyPlaceholder}
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, company: true }))}
          />
        </FormControl>
      </FormField>

      <DialogFooter className="mt-1">
        <DialogClose asChild>
          <Button type="button" variant="ghost" disabled={busy}>
            {labels.cancel}
          </Button>
        </DialogClose>
        <Button ref={submitRef} type="submit" loading={busy}>
          {labels.submit}
        </Button>
      </DialogFooter>
    </form>
  );
}

interface RequestAccessProps {
  doc: TrustDocument;
  onRequest: TrustDocumentsProps["onRequest"];
  /** The address the request went to, once it was sent. The button then reads Requested. */
  sentTo: string | undefined;
  onSent: (documentId: string, email: string) => void;
  contact: TrustContact | undefined;
  labels: TrustDocumentsLabels;
}

/**
 * The button of a document that goes out on request, and the dialog it opens. While a request is on its way the
 * dialog cannot be closed (not by Escape, not by a click outside it, not by its cross), so a failure is never
 * reported to a form the reader has already left.
 */
function RequestAccess({ doc, onRequest, sentTo, onSent, contact, labels }: RequestAccessProps): React.JSX.Element {
  const [busy, setBusy] = useState(false);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={ACTION} aria-label={(sentTo ? labels.requestedFor : labels.requestFor).replace("{title}", doc.title)}>
          {sentTo ? <IconCheck aria-hidden="true" /> : <IconLock aria-hidden="true" />}
          {sentTo ? labels.requested : labels.request}
        </Button>
      </DialogTrigger>
      {/*
        On a short screen (a phone on its side, a keyboard open) the form and its error are taller than the window: the
        dialog keeps a margin all round and scrolls inside itself, so the title and the retry button can always be reached.
        The corner cross is dropped in the confirmation, where the footer button is the one way out that is named.
      */}
      <DialogContent
        className="fixed max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md"
        showCloseButton={!busy && !sentTo}
        onEscapeKeyDown={(event) => busy && event.preventDefault()}
        onInteractOutside={(event) => busy && event.preventDefault()}
      >
        <RequestForm doc={doc} onRequest={onRequest} sentTo={sentTo} onSent={onSent} onBusyChange={setBusy} contact={contact} labels={labels} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * The documents a security review asks for, in one list, so the questionnaire
 * starts here and not in an email thread. Each row says what it is before it
 * asks for a click: a tile with the file type, the title, a line about it, and
 * the date it applies to and the size, which on a wide block get a column of
 * their own so how fresh each document is can be read straight down the list.
 * A public document is a real download link whose name carries the title, the
 * type and the size. One that goes out on request says so in words and opens a
 * dialog with a work email and a company; the details are checked, handed to
 * your `onRequest` with the document's id, and answered with a confirmation (a
 * status message, focused) or an error that keeps everything typed. A request
 * in flight cannot be closed away, so its failure is never lost, and on a short
 * screen the dialog keeps a margin and scrolls inside itself, so its retry
 * button can always be reached. The button then reads Requested, and opening it
 * again shows the confirmation instead of a second form. Nothing is sent or
 * stored by the block: your callback decides what a request is.
 */
export function TrustDocuments({
  eyebrow,
  title,
  description,
  documents,
  onRequest,
  contact,
  headingLevel = 2,
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: TrustDocumentsProps) {
  const labels = { ...LABELS, ...custom };
  const [sent, setSent] = useState<Readonly<Record<string, string>>>({});
  const Name = `h${headingLevel + 1}` as "h3" | "h4";

  return (
    <section data-slot="trust-documents" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      {documents.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{labels.empty}</p>
      ) : (
        <ul role="list" className="mt-10 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card @3xl:mt-12">
          {documents.map((doc) => {
            const asked = sent[doc.id];
            return (
              <li key={doc.id} className="grid gap-4 p-5 @xl:grid-cols-[minmax(0,1fr)_auto] @xl:items-center @xl:gap-x-8 @3xl:grid-cols-[minmax(0,1fr)_8.5rem_10.5rem] @3xl:px-6">
                <div className="flex min-w-0 gap-4">
                  {/* A short type keeps the same 44px tile, so the titles of a list line up; a long one ("Keynote") widens its tile instead of spilling out of it. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "grid h-11 shrink-0 place-items-center rounded-lg border border-border bg-muted/50 text-xs font-semibold tracking-[0.02em] uppercase",
                      Array.from(doc.format).length > 4 ? "min-w-11 px-1.5" : "w-11",
                    )}
                  >
                    {doc.format}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <Name className="min-w-0 text-[0.9375rem] leading-snug font-medium tracking-[-0.01em]">{doc.title}</Name>
                      {doc.access === "request" ? (
                        <Badge variant="muted" className="shrink-0">
                          <IconLock aria-hidden="true" />
                          {labels.onRequest}
                        </Badge>
                      ) : null}
                    </div>
                    {doc.description ? <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{doc.description}</p> : null}
                    {/* On a narrow block the facts are one muted line under the text; on a wide one the date gets a column of its own, so how fresh each document is can be read straight down the list. It is plain inline text, so it breaks only at the <wbr> after a dot: a dot is never the first thing on a line, and the size and the type are never split. */}
                    <p className="mt-2 text-xs text-muted-foreground tabular-nums @3xl:hidden">
                      <span>
                        {labels.updated} <time dateTime={doc.updatedAt}>{formatDate(doc.updatedAt, locale, timeZone)}</time>
                      </span>
                      <span aria-hidden="true" className="px-1.5">
                        &middot;
                      </span>
                      <wbr />
                      <span className="sr-only">, </span>
                      <span className="whitespace-nowrap">{doc.size}</span>
                      <span aria-hidden="true" className="px-1.5">
                        &middot;
                      </span>
                      <wbr />
                      <span className="sr-only">, </span>
                      <span className="whitespace-nowrap">{doc.format}</span>
                    </p>
                  </div>
                </div>

                <p className="hidden @3xl:block">
                  <span className="block text-xs text-muted-foreground">{labels.updated}</span>
                  <time dateTime={doc.updatedAt} className="mt-0.5 block text-sm font-medium tabular-nums">
                    {formatDate(doc.updatedAt, locale, timeZone)}
                  </time>
                  <span className="mt-0.5 block text-xs text-muted-foreground tabular-nums">
                    {doc.size}
                    <span aria-hidden="true" className="px-1.5">
                      &middot;
                    </span>
                    <span className="sr-only">, </span>
                    {doc.format}
                  </span>
                </p>

                {doc.access === "request" ? (
                  <RequestAccess
                    doc={doc}
                    onRequest={onRequest}
                    sentTo={asked}
                    onSent={(documentId, email) => setSent((current) => ({ ...current, [documentId]: email }))}
                    contact={contact}
                    labels={labels}
                  />
                ) : (
                  <Button asChild={Boolean(doc.href)} variant="outline" size="sm" className={ACTION} disabled={!doc.href}>
                    {doc.href ? (
                      <a href={doc.href} download>
                        <IconDownload aria-hidden="true" />
                        {labels.download}
                        <span className="sr-only">
                          {" "}
                          {doc.title}, {doc.format}, {doc.size}
                        </span>
                      </a>
                    ) : (
                      <>
                        <IconDownload aria-hidden="true" />
                        {labels.download}
                        <span className="sr-only">
                          {" "}
                          {doc.title}, {doc.format}, {doc.size}
                        </span>
                      </>
                    )}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {contact ? (
        <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem]">
          <span className="text-muted-foreground">{contact.text ?? labels.contactText}</span>
          <a href={contact.href} className={LINK}>
            {contact.label}
          </a>
        </p>
      ) : null}
    </section>
  );
}
