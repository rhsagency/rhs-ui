/** One sample the customer can ask for: a colour, a texture or a photograph of the material. */
export interface Swatch {
  /** Identity of the sample in your shop: it is what `value`, `onChange` and `onSubmit` carry. */
  id: string;
  /** What it is called, under the swatch: "Oak natural". */
  name: string;
  /** A CSS colour for the swatch: "#d9b88a". It is also the colour the swatch has while a picture loads. */
  color?: string;
  /** A picture of the material: a URL or a data URI. It covers the colour. */
  image?: string;
  /** One short line under the name: the finish, the size. */
  note?: string;
}

/** Where the samples go. */
export interface SampleAddress {
  /** Who the parcel is for. */
  name: string;
  /** For the tracking link. */
  email: string;
  /** The street and the number, and the flat if there is one. */
  line1: string;
  /** The postcode, in the form the country writes it. */
  postalCode: string;
  /** The town or city. */
  city: string;
}

/** What `onSubmit` receives. */
export interface SampleRequestValues {
  /** The ids of the samples that were chosen, in the order they were chosen. */
  swatchIds: string[];
  /** Where to send them. */
  address: SampleAddress;
}

/** What `onSubmit` may hand back besides an error message: the order reference, shown on the confirmation. */
export interface SampleReceipt {
  /** The order's reference, as the shop's system knows it. */
  reference?: string;
}

export const EMPTY_ADDRESS: SampleAddress = { name: "", email: "", line1: "", postalCode: "", city: "" };

/** The fields that can have an error, in the order they are on the page. */
export const FIELD_ORDER = ["samples", "name", "email", "line1", "postalCode", "city"] as const;

export type FieldKey = (typeof FIELD_ORDER)[number];

export type FieldErrors = Partial<Record<FieldKey, string>>;

export interface SampleErrorWords {
  /** Nothing was chosen. */
  samples?: string;
  name?: string;
  email?: string;
  /** For an address that does not look like one. */
  emailInvalid?: string;
  line1?: string;
  postalCode?: string;
  city?: string;
}

export interface SampleFieldWords {
  name?: string;
  email?: string;
  line1?: string;
  postalCode?: string;
  city?: string;
}

export interface SampleRequestLabels {
  /** The heading. */
  title?: string;
  /** Under it. `{limit}`. */
  description?: string;
  /** The same when the limit is one sample. */
  descriptionOne?: string;
  /** The legend over the swatches. */
  legend?: string;
  /** The counter: its name, and its figures. `{count}` and `{limit}`. */
  counterName?: string;
  counter?: string;
  /** Beside the counter when the limit is reached. */
  full?: string;
  /** The title of the summary of what was chosen, and what it says when nothing was. `{limit}`. */
  summaryTitle?: string;
  summaryEmpty?: string;
  /** What it says when nothing was chosen and the limit is one sample. */
  summaryEmptyOne?: string;
  /** What a screen reader hears on the button that removes a sample. `{name}`. */
  remove?: string;
  /** The legend over the address. */
  addressTitle?: string;
  /** The name of every field. */
  fields?: SampleFieldWords;
  /** Under the email field. */
  emailHint?: string;
  /** The button, and while it works. */
  submit?: string;
  submitting?: string;
  /** The title of the notice when the request could not be sent, what it says when you gave no reason, and what is kept. */
  failedTitle?: string;
  failedMessage?: string;
  failedHint?: string;
  /** What a screen reader hears when the request is sent. */
  sentStatus?: string;
  /** The confirmation: the heading, the title of the list, the title of the address and the label of the reference. */
  sentTitle?: string;
  sentList?: string;
  sentAddress?: string;
  sentReference?: string;
  /** The link back to the shop. */
  back?: string;
  /** The error of each field. */
  errors?: SampleErrorWords;
}

export interface SampleWords extends Required<Omit<SampleRequestLabels, "fields" | "errors">> {
  fields: Required<SampleFieldWords>;
  errors: Required<SampleErrorWords>;
}

const WORDS: SampleWords = {
  title: "Order free samples",
  description: "Hold the material before you commit to a roll of it. Choose up to {limit} samples and we send them free of charge.",
  descriptionOne: "Hold the material before you commit to a roll of it. Choose a sample and we send it free of charge.",
  legend: "Choose your samples",
  counterName: "Samples chosen",
  counter: "{count} of {limit}",
  full: "That is the most we can send. Remove one to choose another.",
  summaryTitle: "Your samples",
  summaryEmpty: "Nothing chosen yet. Pick up to {limit} samples.",
  summaryEmptyOne: "Nothing chosen yet. Pick a sample.",
  remove: "Remove {name}",
  addressTitle: "Where should we send them?",
  fields: { name: "Full name", email: "Email", line1: "Street and number", postalCode: "Postcode", city: "City" },
  emailHint: "We email you the tracking link.",
  submit: "Request samples",
  submitting: "Sending",
  failedTitle: "We could not send your request",
  failedMessage: "Something went wrong on our side.",
  failedHint: "Your samples and your address are still here. Try again in a moment.",
  sentStatus: "Your request is sent. The samples are on their way.",
  sentTitle: "Your samples are on their way",
  sentList: "What is coming",
  sentAddress: "Sent to",
  sentReference: "Order reference",
  back: "Back to the shop",
  errors: {
    samples: "Choose at least one sample.",
    name: "Enter your name.",
    email: "Enter your email address.",
    emailInvalid: "That email address does not look right.",
    line1: "Enter the street and the number.",
    postalCode: "Enter the postcode.",
    city: "Enter the city.",
  },
};

/** The default words with the ones you passed on top. */
export function wordsOf(labels: SampleRequestLabels | undefined): SampleWords {
  return { ...WORDS, ...labels, fields: { ...WORDS.fields, ...labels?.fields }, errors: { ...WORDS.errors, ...labels?.errors } } as SampleWords;
}

/** Fills `{name}` placeholders in a sentence. */
export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The message for one field, or undefined when the field is fine. */
export function checkField(key: FieldKey, chosen: readonly string[], address: SampleAddress, errors: Required<SampleErrorWords>): string | undefined {
  switch (key) {
    case "samples":
      return chosen.length > 0 ? undefined : errors.samples;
    case "name":
      return address.name.trim() ? undefined : errors.name;
    case "email": {
      const email = address.email.trim();
      if (!email) return errors.email;
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? undefined : errors.emailInvalid;
    }
    case "line1":
      return address.line1.trim() ? undefined : errors.line1;
    case "postalCode":
      return address.postalCode.trim() ? undefined : errors.postalCode;
    case "city":
      return address.city.trim() ? undefined : errors.city;
  }
}

/** Every problem in the form, by field. An empty object means it can be sent. */
export function validate(chosen: readonly string[], address: SampleAddress, errors: Required<SampleErrorWords>): FieldErrors {
  const found: FieldErrors = {};
  for (const key of FIELD_ORDER) {
    const message = checkField(key, chosen, address, errors);
    if (message) found[key] = message;
  }
  return found;
}

/** The address as it is sent: every field trimmed. */
export function tidy(address: SampleAddress): SampleAddress {
  return { name: address.name.trim(), email: address.email.trim(), line1: address.line1.trim(), postalCode: address.postalCode.trim(), city: address.city.trim() };
}
