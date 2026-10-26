import type { ReactNode } from "react";

import { IconShapes, IconStore, IconUtensils, IconWrench } from "@rhs-ui/icons";

/** One kind of business the customer can pick, drawn as a card. */
export interface BusinessTypeOption {
  /** What `onSubmit` receives when this card is chosen. */
  value: string;
  /** The name on the card: "Retailer". */
  title: string;
  /** A line under it: who it is for. */
  description?: string;
  /** A small icon, drawn at 16px. */
  icon?: ReactNode;
}

/** One answer to "how much do you expect to order each month?". */
export interface SpendBand {
  /** What `onSubmit` receives when this band is chosen. */
  value: string;
  /** What the customer reads: "€2,500 to €10,000". */
  label: string;
}

export const DEFAULT_BUSINESS_TYPES: readonly BusinessTypeOption[] = [
  { value: "retailer", title: "Retailer", description: "A shop, a market stall or a web shop.", icon: <IconStore /> },
  { value: "installer", title: "Installer", description: "Fitters, trades and contractors.", icon: <IconWrench /> },
  { value: "restaurant", title: "Restaurant", description: "Restaurants, cafés and caterers.", icon: <IconUtensils /> },
  { value: "other", title: "Other", description: "Anything else, such as a school or a clinic.", icon: <IconShapes /> },
];

export const DEFAULT_SPEND_BANDS: readonly SpendBand[] = [
  { value: "under-2500", label: "Under €2,500" },
  { value: "2500-10000", label: "€2,500 to €10,000" },
  { value: "10000-25000", label: "€10,000 to €25,000" },
  { value: "25000-50000", label: "€25,000 to €50,000" },
  { value: "over-50000", label: "Over €50,000" },
];

/** ISO 3166-1 alpha-2 codes of the countries offered when `countries` is not passed. */
export const DEFAULT_COUNTRIES: readonly string[] = ["NL", "BE", "DE", "FR", "GB", "IE", "ES", "IT", "AT", "DK", "SE", "PL", "PT", "CH", "US"];
