/** What can go wrong on each field, in words. `{vatNumber}` style placeholders are not used: every message stands alone. */
export interface TradeApplicationErrors {
  companyName?: string;
  registrationNumber?: string;
  vatNumber?: string;
  /** For a VAT number that does not look like one. */
  vatNumberInvalid?: string;
  country?: string;
  contactName?: string;
  email?: string;
  /** For an address that does not look like one. */
  emailInvalid?: string;
  /** For a phone number that has too few digits. */
  phoneInvalid?: string;
  businessType?: string;
  monthlySpend?: string;
  acceptedTerms?: string;
}

export interface TradeApplicationFieldNames {
  companyName?: string;
  registrationNumber?: string;
  vatNumber?: string;
  country?: string;
  contactName?: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  businessType?: string;
  monthlySpend?: string;
  reference?: string;
}

export interface TradeApplicationHints {
  registrationNumber?: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  reference?: string;
}

export interface TradeApplicationLabels {
  /** The heading of the form. */
  title?: string;
  /** Under it. */
  description?: string;
  /** Under that, in small type. */
  requiredNote?: string;
  /** The three groups of fields: a title and a line each. */
  companyTitle?: string;
  companyHint?: string;
  contactTitle?: string;
  contactHint?: string;
  buyingTitle?: string;
  buyingHint?: string;
  /** The name of every field. */
  fields?: TradeApplicationFieldNames;
  /** The line under a field that needs one. */
  hints?: TradeApplicationHints;
  /** After the name of a field that may stay empty. */
  optional?: string;
  /** The placeholder of the country picker. */
  countryPlaceholder?: string;
  /** The search field in the country list. */
  countrySearch?: string;
  /** The country list when nothing matches. */
  countryNone?: string;
  /** The placeholder of the spend select. */
  spendPlaceholder?: string;
  /** The button that attaches the reference. */
  referenceButton?: string;
  /** The terms line is these three, with the link in the middle. */
  termsBefore?: string;
  termsLink?: string;
  termsAfter?: string;
  /** The button, and while it works. */
  submit?: string;
  submitting?: string;
  /** Beside the button. `{days}` working days. */
  promiseOne?: string;
  promiseOther?: string;
  /** The title of the list of problems. `{count}` fields need a look. */
  problemsOne?: string;
  problemsOther?: string;
  /** The title of the notice when the application could not be sent. */
  failedTitle?: string;
  /** What it says when the shop gave no reason of its own. */
  failedMessage?: string;
  /** Under that. */
  failedHint?: string;
  /** What a screen reader hears when the form is sent. */
  sentStatus?: string;
  /** The confirmation. */
  sentTitle?: string;
  /** Under it. `{days}` working days. */
  sentPromiseOne?: string;
  sentPromiseOther?: string;
  /** The title of what the customer gave, and its empty values. */
  sentDetails?: string;
  none?: string;
  /** The names of the details that are not form fields. */
  sentContact?: string;
  /** The title of the steps, and the steps. `{email}` is where the answer goes. */
  sentNext?: string;
  steps?: readonly [string, string, string];
  /** The link back to the shop. */
  back?: string;
  /** The error of each field. */
  errors?: TradeApplicationErrors;
}

export interface TradeApplicationWords extends Required<Omit<TradeApplicationLabels, "fields" | "hints" | "errors">> {
  fields: Required<TradeApplicationFieldNames>;
  hints: Required<TradeApplicationHints>;
  errors: Required<TradeApplicationErrors>;
}

export const WORDS: TradeApplicationWords = {
  title: "Apply for a trade account",
  description: "Tell us about your business. Once we have checked it, trade prices appear in your account.",
  requiredNote: "Everything is required unless it says optional.",
  companyTitle: "Company",
  companyHint: "The business that will place the orders.",
  contactTitle: "Contact",
  contactHint: "The person we write to about this application.",
  buyingTitle: "Buying",
  buyingHint: "What you do and what you expect to order.",
  fields: {
    companyName: "Company name",
    registrationNumber: "Registration number",
    vatNumber: "VAT number",
    country: "Country",
    contactName: "Full name",
    jobTitle: "Job title",
    email: "Work email",
    phone: "Phone",
    businessType: "Type of business",
    monthlySpend: "Expected monthly spend",
    reference: "Trade reference",
  },
  hints: {
    registrationNumber: "As it is on your chamber of commerce extract.",
    vatNumber: "With the country code, for example NL123456789B01.",
    email: "Our answer goes here.",
    phone: "So we can reach you if something is unclear.",
    reference: "A supplier invoice, a letter from your accountant or your trading licence. A PDF or an image, up to 5 MB.",
  },
  optional: "optional",
  countryPlaceholder: "Choose a country",
  countrySearch: "Search countries",
  countryNone: "No country found",
  spendPlaceholder: "Choose a range",
  referenceButton: "Attach a trade reference",
  termsBefore: "I agree to the ",
  termsLink: "trade terms",
  termsAfter: " and confirm that the details above are correct.",
  submit: "Apply for a trade account",
  submitting: "Sending",
  promiseOne: "We reply within {days} working day.",
  promiseOther: "We reply within {days} working days.",
  problemsOne: "Check 1 field before you send",
  problemsOther: "Check {count} fields before you send",
  failedTitle: "We could not send your application",
  failedMessage: "Something went wrong on our side. Try again in a moment.",
  failedHint: "Your answers are still here, nothing was lost.",
  sentStatus: "Your application was sent.",
  sentTitle: "Application received",
  sentPromiseOne: "We reply within {days} working day.",
  sentPromiseOther: "We reply within {days} working days.",
  sentDetails: "What you sent",
  none: "None",
  sentContact: "Contact",
  sentNext: "What happens next",
  steps: ["We check your company and VAT details.", "We email {email} with our decision.", "Trade prices appear in your account as soon as you are approved."],
  back: "Back to the shop",
  errors: {
    companyName: "Enter your company name.",
    registrationNumber: "Enter your registration number.",
    vatNumber: "Enter your VAT number.",
    vatNumberInvalid: "Start the VAT number with the country code, for example NL123456789B01.",
    country: "Choose the country your company is registered in.",
    contactName: "Enter the name of the person we should write to.",
    email: "Enter your work email.",
    emailInvalid: "Check the email address: it should look like name@company.com.",
    phoneInvalid: "Check the phone number: it needs at least 6 digits.",
    businessType: "Choose the type of business.",
    monthlySpend: "Choose how much you expect to order each month.",
    acceptedTerms: "Accept the trade terms to apply.",
  },
};

/** The words with the shop's own on top. The nested groups merge key by key, so one changed field name keeps the rest. */
export function wordsOf(labels: TradeApplicationLabels | undefined): TradeApplicationWords {
  return {
    ...WORDS,
    ...labels,
    fields: { ...WORDS.fields, ...labels?.fields },
    hints: { ...WORDS.hints, ...labels?.hints },
    errors: { ...WORDS.errors, ...labels?.errors },
  };
}

export const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
