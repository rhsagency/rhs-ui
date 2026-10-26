export interface Allergen {
  /** A stable, URL-safe id: "gluten". Dishes name their allergens by it. */
  id: string;
  /** The full name as the regulation words it: "Cereals containing gluten". It is the column's accessible name and the label of its chip. */
  name: string;
  /** What the narrow column head says: "Gluten". Make it start with, or be contained in, the full name. Defaults to the full name. */
  short?: string;
}

/**
 * The fourteen allergens that EU food law (Regulation 1169/2011, Annex II)
 * requires a food business to declare, in the order the regulation lists them.
 * The default columns of an AllergenMatrix. Pass your own list when your
 * market requires different or additional allergens.
 */
export const EU_ALLERGENS: readonly Allergen[] = [
  { id: "gluten", name: "Cereals containing gluten", short: "Gluten" },
  { id: "crustaceans", name: "Crustaceans", short: "Crustaceans" },
  { id: "eggs", name: "Eggs", short: "Eggs" },
  { id: "fish", name: "Fish", short: "Fish" },
  { id: "peanuts", name: "Peanuts", short: "Peanuts" },
  { id: "soya", name: "Soya beans", short: "Soya" },
  { id: "milk", name: "Milk", short: "Milk" },
  { id: "nuts", name: "Tree nuts", short: "Nuts" },
  { id: "celery", name: "Celery", short: "Celery" },
  { id: "mustard", name: "Mustard", short: "Mustard" },
  { id: "sesame", name: "Sesame seeds", short: "Sesame" },
  { id: "sulphites", name: "Sulphur dioxide and sulphites", short: "Sulphites" },
  { id: "lupin", name: "Lupin", short: "Lupin" },
  { id: "molluscs", name: "Molluscs", short: "Molluscs" },
];
