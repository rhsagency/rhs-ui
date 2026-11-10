"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClose, IconImage } from "@rhs-ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button, buttonVariants } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Rating } from "@rhs-ui/primitives/rating";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

/** Where the form is: waiting for input, sending, sent, or failed to send. */
export type ReviewFormStatus = "idle" | "busy" | "done" | "error";

/** What `onSubmit` receives. */
export interface ReviewValues {
  /** One to five. */
  rating: number;
  /** A line that sums it up; empty when left blank. */
  headline: string;
  /** The words themselves. Never empty. */
  story: string;
  /** The first name, which is all that is published. Never empty. */
  name: string;
  /** A role or company; empty when the field is off or left blank. */
  role: string;
  /** Private, never published; empty when left blank. */
  email: string;
  /** The picture the person chose, or null. Always null when the photo field is off. */
  photo: File | null;
  /** Always true: the form does not send without it. */
  consent: true;
}

/** Which optional fields to ask for. The rating, story, first name and consent are always asked. */
export interface ReviewFormFields {
  /** Ask for a role or company next to the name. Default true. */
  role?: boolean;
  /** Ask for a photo. Default false: publishing a face is a bigger step than publishing a first name. */
  photo?: boolean;
}

export interface ReviewFormLabels {
  /** The label of the stars, and what a screen reader hears for the group. Default "Your rating". */
  rating: string;
  /** One word for each star count, shown next to the stars as they are chosen, from one star to five. */
  ratingWords: readonly string[];
  /** Default "Headline". */
  headline: string;
  /** Default "Sum it up in a few words". */
  headlinePlaceholder: string;
  /** Default "Your story". */
  story: string;
  /** Default "What changed for you? What would you tell a friend?". */
  storyPlaceholder: string;
  /** The count under the story, going down as the person types; `{count}` is filled in. Default "{count} characters left". */
  storyCount: string;
  /** Default "First name". */
  name: string;
  /** Default "Only your first name is shown." */
  nameHint: string;
  /** Default "Role or company". */
  role: string;
  /** Default "Email". */
  email: string;
  /** Default "Private. Never shown, only used to confirm the review is yours." */
  emailHint: string;
  /** Default "Photo". */
  photo: string;
  /** Default "A square picture works best. It is shown next to your words." */
  photoHint: string;
  /** The photo button while no picture is chosen. Default "Choose a photo". */
  photoChoose: string;
  /** The photo button once a picture is chosen, for choosing another. Default "Change photo". */
  photoChange: string;
  /** Said next to the photo button while no picture is chosen. Default "No photo chosen". */
  photoNone: string;
  /** The name of the button that takes the chosen picture away again. Default "Remove the photo". */
  photoRemove: string;
  /** Written after the label of a field that may be left empty. Default "Optional". */
  optional: string;
  /** The checkbox. It says exactly what may be published. Default "You may publish my words and first name". */
  consent: string;
  /** The line under the checkbox about how the words are used. A `privacy` prop replaces it. */
  privacy: string;
  /** The button. Default "Send my review". */
  submit: string;
  /** The button while sending, and what is announced. Default "Sending your review". */
  sending: string;
  /** The title of the alert when sending failed. Default "We could not send your review". */
  errorTitle: string;
  /** The alert's text, when no `error` is given. Default "Check your connection and try again. Nothing you wrote is lost." */
  errorBody: string;
  /** The title of the confirmation; `{name}` is filled in. Default "Thank you, {name}". */
  doneTitle: string;
  /** The confirmation's text. Default "Your review reached us. We publish it as you wrote it, with your first name and nothing else." */
  doneBody: string;
  /** Shown under the stars when none is chosen. Default "Choose a rating from one to five stars." */
  requiredRating: string;
  /** Shown under the story when it is empty. Default "Tell us a little about it." */
  requiredStory: string;
  /** Shown under the first name when it is empty. Default "Add your first name." */
  requiredName: string;
  /** Shown under the checkbox when it is not ticked. Default "Tick the box so we may publish your review." */
  requiredConsent: string;
  /** Shown under the email when it is filled in but is not an address. Default "That email address does not look right." */
  invalidEmail: string;
}

export interface ReviewFormProps extends Omit<ComponentProps<"section">, "title" | "children" | "onSubmit" | "defaultValue"> {
  /** Called with the review once every required field is filled. Return a promise to show the busy state until it settles; if it rejects, the form shows the error and keeps every value. */
  onSubmit: (review: ReviewValues) => void | Promise<void>;
  /** The heading of the section. */
  title: string;
  /** One or two sentences under the title: what the words are for. */
  description?: string;
  /** Which optional fields to ask for. */
  fields?: ReviewFormFields;
  /** Drive the state yourself, for a server action or a mutation. Left out, the form follows the promise `onSubmit` returns. */
  status?: ReviewFormStatus;
  /** What went wrong, shown in the alert while the status is "error". */
  error?: ReactNode;
  /** Fill the fields in advance: a name for a signed-in customer, or everything for a form restored after a failed server action. Leave `consent` out for a new visitor; it must be their own act. */
  defaultValues?: Partial<Omit<ReviewValues, "photo">>;
  /** How the words will be used, under the checkbox. Pass links to your privacy page here. */
  privacy?: ReactNode;
  /** Shown under the confirmation, for the next step: a link back to the shop. */
  after?: ReactNode;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ReviewFormLabels>;
}

const LABELS: ReviewFormLabels = {
  rating: "Your rating",
  ratingWords: ["Poor", "Fair", "Good", "Very good", "Excellent"],
  headline: "Headline",
  headlinePlaceholder: "Sum it up in a few words",
  story: "Your story",
  storyPlaceholder: "What changed for you? What would you tell a friend?",
  storyCount: "{count} characters left",
  name: "First name",
  nameHint: "Only your first name is shown.",
  role: "Role or company",
  email: "Email",
  emailHint: "Private. Never shown, only used to confirm the review is yours.",
  photo: "Photo",
  photoHint: "A square picture works best. It is shown next to your words.",
  photoChoose: "Choose a photo",
  photoChange: "Change photo",
  photoNone: "No photo chosen",
  photoRemove: "Remove the photo",
  optional: "Optional",
  consent: "You may publish my words and first name",
  privacy: "We publish your rating, headline, story and first name on our website and in our marketing. Your email stays private. Ask us and we take your review down.",
  submit: "Send my review",
  sending: "Sending your review",
  errorTitle: "We could not send your review",
  errorBody: "Check your connection and try again. Nothing you wrote is lost.",
  doneTitle: "Thank you, {name}",
  doneBody: "Your review reached us. We publish it as you wrote it, with your first name and nothing else.",
  requiredRating: "Choose a rating from one to five stars.",
  requiredStory: "Tell us a little about it.",
  requiredName: "Add your first name.",
  requiredConsent: "Tick the box so we may publish your review.",
  invalidEmail: "That email address does not look right.",
};

/** Room for a story. */
const STORY_LIMIT = 600;

interface Draft {
  rating: number;
  headline: string;
  story: string;
  name: string;
  role: string;
  email: string;
  photo: File | null;
  consent: boolean;
}

type Problems = Partial<Record<"rating" | "story" | "name" | "email" | "consent", string>>;

/** What is wrong with the draft, in the form's own words. Nothing is checked beyond what the form could not send without. */
function problemsOf(draft: Draft, words: ReviewFormLabels): Problems {
  const problems: Problems = {};
  if (draft.rating < 1) problems.rating = words.requiredRating;
  if (!draft.story.trim()) problems.story = words.requiredStory;
  if (!draft.name.trim()) problems.name = words.requiredName;
  if (draft.email.trim() && !/^\S+@\S+\.\S+$/.test(draft.email.trim())) problems.email = words.invalidEmail;
  if (!draft.consent) problems.consent = words.requiredConsent;
  return problems;
}

/** A template with `{name}` holes, filled in. */
const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (hole, name: string) => values[name] ?? hole);

/** The word written after the label of a field that may be left empty. */
function Optional({ children }: { children: ReactNode }) {
  return <span className="font-normal text-muted-foreground">{children}</span>;
}

/** A small preview of the chosen picture, drawn from the file in the browser and let go of when the file changes, so nothing is uploaded to show it. Anything that is not a picture gets the icon. */
function PhotoPreview({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file.type.startsWith("image/")) return;
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url ? (
    <img src={url} alt="" className="size-9 shrink-0 rounded-md border border-border object-cover" />
  ) : (
    <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-4">
      <IconImage />
    </span>
  );
}

/**
 * A form that collects a review or a testimonial and asks only for what will be published: a star rating, a
 * headline, the story with a counter, a first name, a role or company, a private email and, required and
 * unticked, the permission to publish the words and the first name, with a line under it that says how they
 * will be used. Every field keeps a visible label and says when it is optional. Problems appear under the field,
 * are linked to it (the field is marked invalid and described by its message) and focus goes to the first one.
 * Sending locks the fields and puts a spinner in the button; when it is sent, the confirmation replaces the form
 * in place, takes focus and shows what was sent; when it fails, an alert appears above the button and takes
 * focus, one Tab from trying again, and every value stays for another try. A polite live region says "sending"
 * and "sent", and lists the problems it found, so a screen reader hears the result without finding it. The form
 * follows the promise `onSubmit` returns, or you drive `status` yourself.
 */
export function ReviewForm({ onSubmit, title, description, fields, status, error, defaultValues, privacy, after, labels, className, ...props }: ReviewFormProps) {
  const words = { ...LABELS, ...labels };
  const showRole = fields?.role !== false;
  const showPhoto = fields?.photo === true;
  const heading = useId();
  const base = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const [ownStatus, setOwnStatus] = useState<ReviewFormStatus>("idle");
  const [draft, setDraft] = useState<Draft>({
    rating: defaultValues?.rating ?? 0,
    headline: defaultValues?.headline ?? "",
    story: defaultValues?.story ?? "",
    name: defaultValues?.name ?? "",
    role: defaultValues?.role ?? "",
    email: defaultValues?.email ?? "",
    photo: null,
    consent: defaultValues?.consent ?? false,
  });
  const [problems, setProblems] = useState<Problems>({});
  const [focusRequest, setFocusRequest] = useState(0);
  const [summary, setSummary] = useState("");
  const current = status ?? ownStatus;
  const previous = useRef(current);
  const ratingMessageId = `${base}-rating-message`;

  /** Changing a field takes its problem away: the message was about the old value. */
  const update = (patch: Partial<Draft>) => {
    setDraft((old) => ({ ...old, ...patch }));
    setSummary("");
    setProblems((old) => {
      const next = { ...old };
      for (const key of Object.keys(patch)) delete next[key as keyof Problems];
      return next;
    });
  };

  // The stars are a fieldset that Rating gives no props to, so the invalid state and the message of the group are set here. This runs before the effect below moves focus onto them, so a screen reader hears the problem on arrival.
  useEffect(() => {
    const group = starsRef.current?.querySelector<HTMLElement>('[data-slot="rating"]');
    if (!group) return;
    if (problems.rating) {
      group.setAttribute("aria-invalid", "true");
      group.setAttribute("aria-describedby", ratingMessageId);
    } else {
      group.removeAttribute("aria-invalid");
      group.removeAttribute("aria-describedby");
    }
  }, [problems.rating, ratingMessageId, current]);

  // After a failed check, focus the first field that has a problem, once the messages are on the page.
  useEffect(() => {
    if (focusRequest === 0) return;
    formRef.current?.querySelector<HTMLElement>("[data-invalid] :is(input, textarea, button)")?.focus();
  }, [focusRequest]);

  // The button that was pressed is gone when the confirmation takes its place, so focus goes to the confirmation. A failed send loses it too (the button was locked while sending), so focus goes to the alert, one Tab from trying again; a person who has already moved on elsewhere keeps their place. Only on a change, never on load.
  useEffect(() => {
    const before = previous.current;
    previous.current = current;
    if (before !== "done" && current === "done") doneRef.current?.focus();
    else if (before !== "error" && current === "error") {
      const active = document.activeElement;
      if (!active || active === document.body || formRef.current?.contains(active)) alertRef.current?.focus();
    }
  }, [current]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (current === "busy") return;
    const found = problemsOf(draft, words);
    setProblems(found);
    // The messages under the fields are not all in the accessibility tree before they are filled in, so they are also said once, here.
    setSummary(Object.values(found).join(" "));
    if (Object.keys(found).length > 0) {
      setFocusRequest((count) => count + 1);
      return;
    }
    const review: ReviewValues = {
      rating: draft.rating,
      headline: draft.headline.trim(),
      story: draft.story.trim(),
      name: draft.name.trim(),
      role: showRole ? draft.role.trim() : "",
      email: draft.email.trim(),
      photo: showPhoto ? draft.photo : null,
      consent: true,
    };
    if (status === undefined) setOwnStatus("busy");
    try {
      await onSubmit(review);
      if (status === undefined) setOwnStatus("done");
    } catch {
      if (status === undefined) setOwnStatus("error");
    }
  }

  /** Takes the chosen picture away, empties the real input too, and keeps focus where the button was, which is about to go. */
  function removePhoto() {
    if (photoRef.current) photoRef.current.value = "";
    update({ photo: null });
    photoRef.current?.focus();
  }

  const busy = current === "busy";
  const firstName = draft.name.trim();
  const rated = draft.rating > 0 ? words.ratingWords[draft.rating - 1] : undefined;
  const privacyId = `${base}-privacy`;
  const consentId = `${base}-consent`;
  const consentMessageId = `${base}-consent-message`;
  // The count is quiet until the last tenth, then it is said as it changes.
  const storyLeft = STORY_LIMIT - draft.story.length;
  const storyNear = storyLeft <= Math.max(10, Math.round(STORY_LIMIT * 0.1));
  // An alert announces itself; the quiet states and the problems found are said here.
  const announcement = busy ? words.sending : current === "done" ? `${fill(words.doneTitle, { name: firstName })}. ${words.doneBody}` : summary;

  return (
    <section data-slot="review-form" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <div className="mx-auto w-full max-w-xl">
        <header className="text-center">
          <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
            {title}
          </h2>
          {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
        </header>
        <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-card-foreground sm:mt-12 sm:p-8">
          {current === "done" ? (
            <div ref={doneRef} tabIndex={-1} className="grid justify-items-center gap-6 py-2 text-center outline-none">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-foreground text-background [&_svg]:size-5">
                <IconCheck />
              </span>
              <div className="grid gap-2">
                <h3 className="text-xl font-medium tracking-[-0.02em]">{fill(words.doneTitle, { name: firstName })}</h3>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-pretty text-muted-foreground">{words.doneBody}</p>
              </div>
              <div className="grid w-full max-w-sm gap-2 rounded-xl border border-border bg-muted/50 p-4 text-left">
                <Rating readOnly value={draft.rating} size={16} label={words.rating} />
                {draft.headline.trim() ? <p className="text-sm leading-snug font-medium">{draft.headline.trim()}</p> : null}
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{draft.story.trim()}</p>
                <p className="text-xs text-muted-foreground">
                  {firstName}
                  {showRole && draft.role.trim() ? `, ${draft.role.trim()}` : ""}
                </p>
              </div>
              {after}
            </div>
          ) : (
            <form ref={formRef} noValidate onSubmit={send}>
              {/* One column that may shrink to nothing, so a long file name or an unbroken word in the privacy line is cut or wrapped inside the card and never pushes the fields out of it. */}
              <fieldset disabled={busy} className="m-0 grid min-w-0 grid-cols-1 gap-6 border-0 p-0">
                <div data-invalid={problems.rating ? "" : undefined} className="grid gap-2">
                  <span aria-hidden="true" className={cn("text-sm leading-none font-medium", problems.rating && "text-destructive")}>
                    {words.rating}
                  </span>
                  <div className="flex items-center gap-3">
                    {/* The wrapper is how the effect above finds the group of stars. */}
                    <div ref={starsRef} className="flex">
                      <Rating name={`${base}-rating`} label={words.rating} size={28} value={draft.rating} onValueChange={(rating) => update({ rating })} />
                    </div>
                    <span aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
                      {rated}
                    </span>
                  </div>
                  <p id={ratingMessageId} role="status" className="text-xs font-medium text-destructive empty:sr-only">
                    {problems.rating}
                  </p>
                </div>

                <FormField>
                  <FormLabel>
                    {words.headline}
                    <Optional>{words.optional}</Optional>
                  </FormLabel>
                  <FormControl>
                    <Input value={draft.headline} maxLength={80} placeholder={words.headlinePlaceholder} onChange={(event) => update({ headline: event.target.value })} />
                  </FormControl>
                </FormField>

                {/* The count is the field's description, so the story is marked invalid and points at the count and, while it is wrong, at the message, like every other field. */}
                <FormField error={problems.story} described>
                  <FormLabel>{words.story}</FormLabel>
                  <FormControl>
                    <Textarea rows={5} required maxLength={STORY_LIMIT} value={draft.story} placeholder={words.storyPlaceholder} onChange={(event) => update({ story: event.target.value })} />
                  </FormControl>
                  <FormDescription aria-live={storyNear ? "polite" : "off"} className={cn("text-right tabular-nums", storyNear && "text-foreground")}>
                    {fill(words.storyCount, { count: String(storyLeft) })}
                  </FormDescription>
                </FormField>

                <div className={cn("grid items-start gap-6", showRole && "sm:grid-cols-2")}>
                  <FormField error={problems.name} described>
                    <FormLabel>{words.name}</FormLabel>
                    <FormControl>
                      <Input value={draft.name} maxLength={40} required autoComplete="given-name" onChange={(event) => update({ name: event.target.value })} />
                    </FormControl>
                    <FormDescription>{words.nameHint}</FormDescription>
                  </FormField>
                  {showRole ? (
                    <FormField>
                      <FormLabel>
                        {words.role}
                        <Optional>{words.optional}</Optional>
                      </FormLabel>
                      <FormControl>
                        <Input value={draft.role} maxLength={60} autoComplete="organization-title" onChange={(event) => update({ role: event.target.value })} />
                      </FormControl>
                    </FormField>
                  ) : null}
                </div>

                {showPhoto ? (
                  <FormField described className="grid-cols-1">
                    <FormLabel>
                      {words.photo}
                      <Optional>{words.optional}</Optional>
                    </FormLabel>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
                      {/* The real file input stays in the form, hidden but focusable, so the keyboard, a screen reader and FormData all use the native control; the label around it is the button a person sees and presses. */}
                      <label className="group/photo relative inline-flex cursor-pointer has-[:disabled]:cursor-not-allowed">
                        <FormControl>
                          <input ref={photoRef} type="file" accept="image/*" onChange={(event) => update({ photo: event.target.files?.[0] ?? null })} className="peer sr-only" />
                        </FormControl>
                        <span
                          aria-hidden="true"
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                            "transition-colors group-hover/photo:bg-muted peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/40 peer-disabled:opacity-50 motion-reduce:transition-none",
                          )}
                        >
                          <IconImage />
                          {draft.photo ? words.photoChange : words.photoChoose}
                        </span>
                      </label>
                      {draft.photo ? (
                        <span className="flex min-w-0 flex-1 basis-40 items-center gap-2.5">
                          <PhotoPreview key={`${draft.photo.name}-${draft.photo.size}-${draft.photo.lastModified}`} file={draft.photo} />
                          <span className="min-w-0 flex-1 truncate text-sm">{draft.photo.name}</span>
                          <Button type="button" variant="ghost" size="icon-sm" aria-label={words.photoRemove} onClick={removePhoto} className="shrink-0 text-muted-foreground hover:text-foreground">
                            <IconClose />
                          </Button>
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">{words.photoNone}</span>
                      )}
                    </div>
                    <FormDescription>{words.photoHint}</FormDescription>
                  </FormField>
                ) : null}

                <FormField error={problems.email} described>
                  <FormLabel>
                    {words.email}
                    <Optional>{words.optional}</Optional>
                  </FormLabel>
                  <FormControl>
                    <Input type="email" inputMode="email" autoComplete="email" maxLength={120} value={draft.email} onChange={(event) => update({ email: event.target.value })} />
                  </FormControl>
                  <FormDescription>{words.emailHint}</FormDescription>
                </FormField>

                <div data-invalid={problems.consent ? "" : undefined} className="grid gap-2">
                  <div className="grid gap-2 rounded-xl bg-muted/50 p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={consentId}
                        required
                        checked={draft.consent}
                        aria-invalid={problems.consent ? true : undefined}
                        aria-describedby={problems.consent ? `${privacyId} ${consentMessageId}` : privacyId}
                        onCheckedChange={(checked) => update({ consent: checked === true })}
                        className="mt-px"
                      />
                      <Label htmlFor={consentId} className="text-sm leading-snug">
                        {words.consent}
                      </Label>
                    </div>
                    <p id={privacyId} className="pl-[30px] text-xs leading-relaxed text-muted-foreground">
                      {privacy ?? words.privacy}
                    </p>
                  </div>
                  {/* Under the panel, not in it: on the card the red is 4.8:1, on the panel's grey it falls under 4.5:1. */}
                  <p id={consentMessageId} role="status" className="text-xs font-medium text-destructive empty:sr-only">
                    {problems.consent}
                  </p>
                </div>

                {current === "error" ? (
                  <Alert ref={alertRef} tabIndex={-1} tone="destructive" role="alert" className="outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                    <IconAlertCircle />
                    {/* The red is in the border, the tint and the icon; the words stay in the text colour, which keeps them above 4.5:1 on the tint. */}
                    <AlertTitle className="text-foreground">{words.errorTitle}</AlertTitle>
                    <AlertDescription>{error ?? words.errorBody}</AlertDescription>
                  </Alert>
                ) : null}

                <Button type="submit" size="lg" loading={busy} className="w-full sm:w-auto sm:justify-self-start">
                  {busy ? words.sending : words.submit}
                </Button>
              </fieldset>
            </form>
          )}
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    </section>
  );
}
