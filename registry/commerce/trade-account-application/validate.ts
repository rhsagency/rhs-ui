import type { TradeApplicationErrors } from "@rhs-ui/commerce/trade-account-application/words";

/** What the customer filled in. It is what `onSubmit` receives. */
export interface TradeApplicationValues {
  /** The trading name of the company. */
  companyName: string;
  /** The number in the company register (in the Netherlands the KvK number). */
  registrationNumber: string;
  /** The VAT number with its country code, without spaces: "NL123456789B01". */
  vatNumber: string;
  /** ISO 3166-1 alpha-2 code of the country the company is registered in: "NL". */
  country: string;
  /** The person we write to. */
  contactName: string;
  /** Their job title. Empty when left out. */
  jobTitle: string;
  /** Their work email. */
  email: string;
  /** Their phone number. Empty when left out. */
  phone: string;
  /** The `value` of the business type that was chosen. */
  businessType: string;
  /** The `value` of the spend band that was chosen. */
  monthlySpend: string;
  /** The trade reference that was attached, or null. */
  reference: File | null;
  /** True once the terms were accepted: the form cannot be sent without it. */
  acceptedTerms: boolean;
}

/** The fields that can have an error, in the order they are on the page. */
export const FIELD_ORDER = ["companyName", "registrationNumber", "vatNumber", "country", "contactName", "email", "phone", "businessType", "monthlySpend", "acceptedTerms"] as const;

export type FieldKey = (typeof FIELD_ORDER)[number];

export type FieldErrors = Partial<Record<FieldKey, string>>;

export const EMPTY: TradeApplicationValues = {
  companyName: "",
  registrationNumber: "",
  vatNumber: "",
  country: "",
  contactName: "",
  jobTitle: "",
  email: "",
  phone: "",
  businessType: "",
  monthlySpend: "",
  reference: null,
  acceptedTerms: false,
};

/** A VAT number with the spaces, dots and hyphens people type taken out, in capitals. */
export function cleanVat(value: string): string {
  return value.replace(/[\s.\-]/g, "").toUpperCase();
}

/** The message for one field, or undefined when the field is fine. */
export function checkField(key: FieldKey, values: TradeApplicationValues, errors: Required<TradeApplicationErrors>): string | undefined {
  switch (key) {
    case "companyName":
      return values.companyName.trim() ? undefined : errors.companyName;
    case "registrationNumber":
      return values.registrationNumber.trim() ? undefined : errors.registrationNumber;
    case "vatNumber": {
      const vat = cleanVat(values.vatNumber);
      if (!vat) return errors.vatNumber;
      // Two letters for the country, then the number: this is a sanity check, not a registry lookup.
      return /^[A-Z]{2}[A-Z0-9]{6,12}$/.test(vat) ? undefined : errors.vatNumberInvalid;
    }
    case "country":
      return values.country ? undefined : errors.country;
    case "contactName":
      return values.contactName.trim() ? undefined : errors.contactName;
    case "email": {
      const email = values.email.trim();
      if (!email) return errors.email;
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? undefined : errors.emailInvalid;
    }
    case "phone": {
      const phone = values.phone.trim();
      if (!phone) return undefined;
      return phone.replace(/\D/g, "").length >= 6 ? undefined : errors.phoneInvalid;
    }
    case "businessType":
      return values.businessType ? undefined : errors.businessType;
    case "monthlySpend":
      return values.monthlySpend ? undefined : errors.monthlySpend;
    case "acceptedTerms":
      return values.acceptedTerms ? undefined : errors.acceptedTerms;
  }
}

/** Every problem in the form, by field. An empty object means it can be sent. */
export function validate(values: TradeApplicationValues, errors: Required<TradeApplicationErrors>): FieldErrors {
  const found: FieldErrors = {};
  for (const key of FIELD_ORDER) {
    const message = checkField(key, values, errors);
    if (message) found[key] = message;
  }
  return found;
}

/** What goes to `onSubmit`: the text fields trimmed and the VAT number cleaned. */
export function tidy(values: TradeApplicationValues): TradeApplicationValues {
  return {
    ...values,
    companyName: values.companyName.trim(),
    registrationNumber: values.registrationNumber.trim(),
    vatNumber: cleanVat(values.vatNumber),
    contactName: values.contactName.trim(),
    jobTitle: values.jobTitle.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
  };
}
