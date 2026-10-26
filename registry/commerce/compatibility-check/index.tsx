"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconCheckCircle, IconChevronDown, IconHelp, IconSearch, IconXCircle } from "@rhs-ui/icons";
import { verdictFor, type FitVerdict, type ModelIds } from "@rhs-ui/commerce/compatibility-check/fit";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Combobox, type ComboboxOption } from "@rhs-ui/primitives/combobox";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export type { FitVerdict, ModelIds } from "@rhs-ui/commerce/compatibility-check/fit";

export interface CompatibilityBrand {
  /** Identity of the brand, which models point at with `brand`. */
  id: string;
  /** What the shopper reads: "Orbit". */
  name: string;
}

export interface CompatibilityModel {
  /** Identity of the model: the id in `compatible` and `incompatible`. */
  id: string;
  /** The id of its brand. */
  brand: string;
  /** What the shopper reads and searches: "One Pro". */
  name: string;
  /** A second line in the list: "Released 2023". */
  description?: string;
  /** Other words the search matches: a model number, a former name. */
  keywords?: readonly string[];
  /** Models with the same group sit under one heading: "One series". */
  group?: string;
}

export interface CompatibilityAlternative {
  /** The product that does fit: "Halcyon ClampGrip vent mount". */
  name: string;
  /** Where it is. Without it the name is plain text. */
  href?: string;
  /** A short note after the name, such as its price: "EUR 24.90". */
  detail?: string;
}

/** What the shopper has chosen so far. */
export interface CompatibilityChoice {
  /** The id of the brand, or null. */
  brand: string | null;
  /** The id of the model, or null. Always one of the chosen brand's models. */
  model: string | null;
}

/** The outcome handed to `onCheck`. */
export interface CompatibilityResult {
  /** The brand that was chosen. */
  brand: CompatibilityBrand;
  /** The model that was chosen. */
  model: CompatibilityModel;
  /** Whether the product fits it: compatible, incompatible or unknown. */
  verdict: FitVerdict;
}

export interface CompatibilityCheckLabels {
  /** The heading. */
  title?: string;
  /** The name of the first field. */
  brand?: string;
  /** The name of the second field. */
  model?: string;
  brandPlaceholder?: string;
  /** In the model field while no brand is chosen. Short: the reason it is disabled is `modelWaiting`. */
  modelIdle?: string;
  /** Under the model field while no brand is chosen: it says why the field is disabled. */
  modelWaiting?: string;
  /** In the model field once a brand is chosen. `{count}` is how many models it has. */
  modelPlaceholder?: string;
  /** In the model field when the chosen brand has no models listed. */
  modelNone?: string;
  searchPlaceholder?: string;
  /** When the search finds nothing. */
  noModel?: string;
  /** In the answer area before both are chosen. `{brand}` and `{model}` are the two field names, in lower case. */
  idle?: string;
  compatibleTitle?: string;
  /** Under the answer. `{product}`, `{brand}` and `{model}`. */
  compatibleText?: string;
  incompatibleTitle?: string;
  incompatibleText?: string;
  /** Before the list of products that do fit. */
  alternativesIntro?: string;
  unknownTitle?: string;
  unknownText?: string;
  /** The link to ask the shop, when you pass `contactHref`. */
  contact?: string;
}

const WORDS = {
  title: "Check the fit",
  brand: "Brand",
  model: "Model",
  brandPlaceholder: "Choose a brand",
  modelIdle: "Choose a model",
  modelWaiting: "Choose a brand first.",
  modelPlaceholder: "Search {count} models",
  modelNone: "No models listed",
  searchPlaceholder: "Search models...",
  noModel: "No model matches that.",
  idle: "Choose your {brand} and {model} and we will tell you if it fits.",
  compatibleTitle: "Compatible with {model}",
  compatibleText: "{product} fits the {brand} {model}.",
  incompatibleTitle: "Not compatible with {model}",
  incompatibleText: "{product} does not fit the {brand} {model}.",
  alternativesIntro: "Try these instead:",
  unknownTitle: "We cannot confirm this fit",
  unknownText: "We have no fit information for the {brand} {model} yet, so we will not guess. Ask us before you order.",
  contact: "Ask us about the fit",
} satisfies Required<CompatibilityCheckLabels>;

export interface CompatibilityCheckProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange" | "title"> {
  /** The brands to choose from, in the order they are shown. */
  brands: readonly CompatibilityBrand[];
  /** Every model, each pointing at its brand. The second field lists the chosen brand's models. */
  models: readonly CompatibilityModel[];
  /** The ids of the models the product fits. */
  compatible: ModelIds;
  /** The ids of the models it is known not to fit. Pass it and a model on neither list is reported as unknown; leave it out and every model that is not compatible is reported as not compatible. */
  incompatible?: ModelIds;
  /** The product, shown under the heading and in the answer: "Halcyon Slim case". It reads as the subject of a sentence, so keep it singular. */
  productName: string;
  /** Products that do fit, by the id of the model they are suggested for. They are listed when that model is not compatible. */
  alternatives?: Readonly<Record<string, readonly CompatibilityAlternative[]>>;
  /** Where a shopper can ask when the answer is unknown. Without it the unknown answer has no link. */
  contactHref?: string;
  /** The choice, when you control it. Pair it with `onChange`. */
  value?: CompatibilityChoice;
  /** The choice to start with when the check keeps it itself: the one you remembered from last time. */
  defaultValue?: Partial<CompatibilityChoice>;
  /** Called when the brand or the model changes. Choosing a brand clears the model. */
  onChange?: (choice: CompatibilityChoice) => void;
  /** Called when a brand and a model are chosen, with the answer: the place to remember the last choice. */
  onCheck?: (result: CompatibilityResult) => void;
  /** Replaces the heading. */
  title?: string;
  /** The words, for another language. */
  labels?: CompatibilityCheckLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** A link's text with its arrow, the arrow held to the last word so it never wraps onto a line of its own. */
function WithArrow({ text }: { text: string }) {
  const at = text.lastIndexOf(" ");
  return (
    <>
      {at === -1 ? "" : text.slice(0, at + 1)}
      <span className="whitespace-nowrap">
        {text.slice(at + 1)}
        <IconArrowRight aria-hidden="true" className="ml-1 inline size-3.5 align-[-0.15em]" />
      </span>
    </>
  );
}

const VERDICT = {
  compatible: { icon: IconCheckCircle, tone: "default" },
  incompatible: { icon: IconXCircle, tone: "destructive" },
  unknown: { icon: IconHelp, tone: "info" },
} as const;

/**
 * "Will it fit?" for cases, filters and spare parts: the shopper picks a brand and then a model from a list that
 * can be searched, and gets an answer in words and an icon, never colour alone. The model field stays disabled
 * until there is a brand and says so in plain text under the field. An answer is compatible, not compatible (with the
 * products that do fit, when you have them) or unknown: a model nobody has checked is never guessed at. The
 * answer area is a polite status, and the last choice goes back to you through `onCheck`, so you can remember it.
 */
export function CompatibilityCheck({
  brands,
  models,
  compatible,
  incompatible,
  productName,
  alternatives,
  contactHref,
  value,
  defaultValue,
  onChange,
  onCheck,
  title,
  labels,
  className,
  ...props
}: CompatibilityCheckProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const [own, setOwn] = useState<CompatibilityChoice>({ brand: defaultValue?.brand ?? null, model: defaultValue?.model ?? null });
  const choice = value ?? own;

  const brand = brands.find((entry) => entry.id === choice.brand) ?? null;
  const ofBrand = brand ? models.filter((entry) => entry.brand === brand.id) : [];
  const model = ofBrand.find((entry) => entry.id === choice.model) ?? null;
  const verdict = brand && model ? verdictFor(model.id, compatible, incompatible) : null;

  function update(next: CompatibilityChoice) {
    if (value === undefined) setOwn(next);
    onChange?.(next);
    const nextBrand = brands.find((entry) => entry.id === next.brand);
    const nextModel = models.find((entry) => entry.id === next.model && entry.brand === next.brand);
    if (nextBrand && nextModel) onCheck?.({ brand: nextBrand, model: nextModel, verdict: verdictFor(nextModel.id, compatible, incompatible) });
  }

  const options: ComboboxOption[] = ofBrand.map((entry) => ({ value: entry.id, label: entry.name, keywords: entry.keywords, description: entry.description, group: entry.group }));
  const values = { product: productName, brand: brand?.name ?? "", model: model?.name ?? "" };
  const suggestions = model && verdict === "incompatible" ? (alternatives?.[model.id] ?? []) : [];

  let answer: ReactNode = (
    <div className="flex items-start gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
      <IconSearch aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p>{fill(words.idle, { brand: words.brand.toLowerCase(), model: words.model.toLowerCase() })}</p>
    </div>
  );
  if (verdict) {
    const look = VERDICT[verdict];
    const Icon = look.icon;
    const heading = verdict === "compatible" ? words.compatibleTitle : verdict === "incompatible" ? words.incompatibleTitle : words.unknownTitle;
    const text = verdict === "compatible" ? words.compatibleText : verdict === "incompatible" ? words.incompatibleText : words.unknownText;
    answer = (
      <Alert key={verdict} role="none" tone={look.tone} data-verdict={verdict} className="px-4 py-3.5 motion-safe:animate-rhs-fit-in">
        <Icon />
        {/* The title stays in the text colour: the icon, the border and the words carry the meaning, and tinted red on a tinted ground falls just short of AA. */}
        <AlertTitle className="text-foreground">{fill(heading, values)}</AlertTitle>
        <AlertDescription>
          <p className="text-pretty">{fill(text, values)}</p>
          {suggestions.length ? (
            <>
              <p className="mt-1 font-medium text-foreground">{words.alternativesIntro}</p>
              <ul className="grid gap-1.5">
                {suggestions.map((item) => (
                  <li key={item.name} className="flex flex-wrap items-baseline gap-x-2">
                    {item.href ? (
                      <a href={item.href} className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none hover:decoration-2 focus-visible:ring-[3px] focus-visible:ring-ring/40">
                        <WithArrow text={item.name} />
                      </a>
                    ) : (
                      <span className="font-medium text-foreground">{item.name}</span>
                    )}
                    {item.detail ? <span className="text-xs tabular-nums">{item.detail}</span> : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {verdict === "unknown" && contactHref ? (
            <a href={contactHref} className="mt-1 w-fit rounded-sm font-medium text-foreground underline underline-offset-4 outline-none hover:decoration-2 focus-visible:ring-[3px] focus-visible:ring-ring/40">
              <WithArrow text={words.contact} />
            </a>
          ) : null}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div data-slot="compatibility-check" data-verdict={verdict ?? undefined} role="group" aria-labelledby={`${id}-title`} className={cn("grid w-full grid-cols-[minmax(0,1fr)] gap-5", className)} {...props}>
      <div className="grid gap-1">
        <h3 id={`${id}-title`} className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em]">
          {title ?? words.title}
        </h3>
        <p className="text-sm text-muted-foreground">{productName}</p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] items-start gap-4">
        <FormField>
          <FormLabel>{words.brand}</FormLabel>
          <Select value={choice.brand ?? ""} onValueChange={(next) => update({ brand: next, model: null })}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={words.brandPlaceholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {brands.map((entry) => (
                <SelectItem key={entry.id} value={entry.id}>
                  {entry.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField described={!brand}>
          <FormLabel>{words.model}</FormLabel>
          {/* The combobox draws the up-down glyph of a searchable list, the brand select beside it a plain chevron. Its glyph is hidden (it keeps its room, so the text still stops short of it) and the chevron of the select is laid over it, so the two fields match. */}
          <div className="relative">
            <FormControl>
              <Combobox
                label={words.model}
                options={options}
                value={model?.id ?? null}
                onValueChange={(next) => update({ brand: choice.brand, model: next })}
                disabled={!brand || options.length === 0}
                placeholder={!brand ? words.modelIdle : options.length === 0 ? words.modelNone : fill(words.modelPlaceholder, { count: String(options.length) })}
                searchPlaceholder={words.searchPlaceholder}
                emptyText={words.noModel}
                className="[&>svg]:invisible"
              />
            </FormControl>
            <IconChevronDown aria-hidden="true" className={cn("pointer-events-none absolute top-1/2 right-[13px] size-4 -translate-y-1/2 text-muted-foreground", (!brand || options.length === 0) && "opacity-50")} />
          </div>
          {/* The reason the field is disabled is written out where it can be read, not left as dimmed placeholder text. */}
          {!brand ? <FormDescription>{words.modelWaiting}</FormDescription> : null}
        </FormField>
      </div>

      <div role="status" aria-live="polite" aria-atomic="true">
        {answer}
      </div>
    </div>
  );
}
