/** Whether a product fits a model, as far as anyone knows. */
export type FitVerdict = "compatible" | "incompatible" | "unknown";

/** A list of model ids: an array, or a Set when you already have one. */
export type ModelIds = readonly string[] | ReadonlySet<string>;

const has = (ids: ModelIds, id: string): boolean => (Array.isArray(ids) ? (ids as readonly string[]).includes(id) : (ids as ReadonlySet<string>).has(id));

/**
 * The answer for one model. A model on the `compatible` list fits. Where you also list the models it is known
 * not to fit (`incompatible`), a model on neither list is "unknown": nobody has checked, so the answer is not
 * a guess. Without that second list every model that is not compatible is reported as not compatible.
 */
export function verdictFor(modelId: string, compatible: ModelIds, incompatible?: ModelIds): FitVerdict {
  if (has(compatible, modelId)) return "compatible";
  if (incompatible === undefined) return "incompatible";
  return has(incompatible, modelId) ? "incompatible" : "unknown";
}
