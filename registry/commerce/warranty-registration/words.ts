import type { WarrantyErrorWords } from "@rhs-ui/commerce/warranty-registration/warranty";

/** The name of each field. */
export interface WarrantyFieldWords {
  product?: string;
  /** The model line on the confirmation. */
  model?: string;
  serial?: string;
  purchaseDate?: string;
  store?: string;
  proof?: string;
}

/** The line under a field that needs one. */
export interface WarrantyHintWords {
  /** Under the product field, which is only there when you did not pass a product. */
  product?: string;
  /** Under the shop field. */
  store?: string;
  /** Under the receipt field. `{size}` is the largest file. */
  proof?: string;
}

/** Everything the form and its confirmation say. Pass the ones you want in another language or another voice. */
export interface WarrantyRegistrationLabels {
  /** The heading when the product is not known. */
  title?: string;
  /** The heading when it is. `{product}`. */
  titleNamed?: string;
  /** Under the heading. */
  description?: string;
  /** Under that, in small type. */
  requiredNote?: string;
  /** The name of every field. */
  fields?: WarrantyFieldWords;
  /** The line under a field that needs one. */
  hints?: WarrantyHintWords;
  /** The placeholder of the serial field when you gave no example. */
  serialPlaceholder?: string;
  /** The placeholder of the serial field when you gave an example, which is not a value and must not look like one. `{example}`. */
  serialPlaceholderExample?: string;
  /** The placeholder of the product field. */
  productPlaceholder?: string;
  /** The placeholder of the date picker. */
  datePlaceholder?: string;
  /** After the name of a field that may stay empty. */
  optional?: string;
  /** The button that attaches the receipt. */
  proofButton?: string;
  /** The consent line. */
  consent?: string;
  /** The link after it, when you passed `privacyHref`. */
  privacyLink?: string;
  /** The button, and while it works. */
  submit?: string;
  submitting?: string;
  /** Under the date, once a day is chosen: the end of the cover. `{date}`. */
  coveredUntil?: string;
  /** After it. `{duration}` is "2 years" or "18 months". */
  coveredFor?: string;
  /** The badge on the product: `{duration}` of warranty. */
  warrantyBadge?: string;
  /** The title and the three lines of what to have ready. */
  readyTitle?: string;
  ready?: readonly [string, string, string];
  /** The title of the notice when the registration could not be sent, and what it says when you gave no reason. */
  failedTitle?: string;
  failedMessage?: string;
  failedHint?: string;
  /** What a screen reader hears when the form is sent. `{date}`. */
  sentStatus?: string;
  /** The confirmation's heading when the product is not known. */
  sentTitle?: string;
  /** The heading when it is. `{product}`. */
  sentTitleNamed?: string;
  /** The small label above the end date. */
  sentCovered?: string;
  /** Under the date. `{duration}` and `{date}` is the day of purchase. */
  sentFrom?: string;
  /** The title of what the customer gave. */
  sentDetails?: string;
  /** The names of the details on the confirmation that are not form fields. */
  purchased?: string;
  /** Beside the shop or the order number on the confirmation. */
  boughtAt?: string;
  reference?: string;
  /** The line under the product's name when you passed a model. `{model}`. */
  modelLine?: string;
  /** The title of the lists of what is and is not covered. */
  coversTitle?: string;
  excludesTitle?: string;
  /** The link back to the shop. */
  back?: string;
  /** The error of each field. */
  errors?: WarrantyErrorWords;
}

export interface WarrantyWords extends Required<Omit<WarrantyRegistrationLabels, "fields" | "hints" | "errors">> {
  fields: Required<WarrantyFieldWords>;
  hints: Required<WarrantyHintWords>;
  errors: Required<WarrantyErrorWords>;
}

const WORDS: WarrantyWords = {
  title: "Register your product",
  titleNamed: "Register your {product}",
  description: "It takes a minute. You get proof that your warranty is valid, and we can find your purchase straight away if you ever need a repair.",
  requiredNote: "Everything is required unless it says optional.",
  fields: {
    product: "Product",
    model: "Model",
    serial: "Serial number",
    purchaseDate: "Date of purchase",
    store: "Shop or order number",
    proof: "Proof of purchase",
  },
  hints: {
    product: "As it is written on the box or the rating plate.",
    store: "The shop's name, or the number on your order confirmation.",
    proof: "A photo or a PDF of your receipt or invoice, up to {size}.",
  },
  serialPlaceholder: "Serial number",
  serialPlaceholderExample: "For example {example}",
  productPlaceholder: "For example Halcyon Aria",
  datePlaceholder: "Choose the day",
  optional: "optional",
  proofButton: "Attach receipt",
  consent: "I agree that these details are stored to handle warranty claims for this product.",
  privacyLink: "Privacy notice",
  submit: "Register my product",
  submitting: "Registering",
  coveredUntil: "Covered until {date}",
  coveredFor: "{duration} from the day you bought it.",
  warrantyBadge: "{duration} warranty",
  readyTitle: "Have ready",
  ready: ["The serial number from the label", "The day and the shop you bought it", "Your receipt or invoice"],
  failedTitle: "We could not register your product",
  failedMessage: "Something went wrong on our side.",
  failedHint: "Everything you entered is still here. Try again in a moment.",
  sentStatus: "Your product is registered. It is covered until {date}.",
  sentTitle: "Your product is registered",
  sentTitleNamed: "Your {product} is registered",
  sentCovered: "Covered until",
  sentFrom: "{duration} from your purchase on {date}.",
  sentDetails: "Your registration",
  purchased: "Purchased",
  boughtAt: "Bought at",
  reference: "Reference",
  modelLine: "Model {model}",
  coversTitle: "What is covered",
  excludesTitle: "What is not covered",
  back: "Back to the shop",
  errors: {
    product: "Tell us which product it is.",
    serial: "Enter the serial number.",
    serialMismatch: "That does not look like a serial number for this product.",
    serialExample: "It looks like {example}.",
    purchaseDate: "Choose the day you bought it.",
    purchaseDateFuture: "The day of purchase cannot be in the future.",
    purchaseDateEnded: "The cover for a purchase on that day ended on {date}.",
    store: "Tell us where you bought it.",
    proof: "Attach your receipt or invoice.",
    consent: "Tick the box to continue.",
  },
};

/** The default words with the ones you passed on top. */
export function wordsOf(labels: WarrantyRegistrationLabels | undefined): WarrantyWords {
  return {
    ...WORDS,
    ...labels,
    fields: { ...WORDS.fields, ...labels?.fields },
    hints: { ...WORDS.hints, ...labels?.hints },
    errors: { ...WORDS.errors, ...labels?.errors },
  } as WarrantyWords;
}

/** Fills `{name}` placeholders in a sentence. */
export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
