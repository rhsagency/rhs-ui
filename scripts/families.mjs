/**
 * The family is what a developer scans for: categories[1]. Primitives and
 * marketing sections must name one; the other categories are a family of
 * their own unless they name a more precise one. The registry gate enforces
 * it, and the build writes it to meta.family so rhsui.com can group the
 * library without a list of names.
 */
export const FAMILIES = new Set([
  "actions", "forms", "overlay", "navigation", "data-display", "feedback", "layout", "motion", "scroll", "theme",
  "page-chrome", "hero", "features", "social-proof", "conversion", "account", "content", "text", "ai",
  "application", "commerce", "dashboard", "models", "icons", "backgrounds", "templates",
]);

const MUST_NAME_FAMILY = new Set(["primitives", "marketing", "motion"]);

export function familyOf(item) {
  const [category, second] = item.categories ?? [];
  if (second && FAMILIES.has(second)) return second;
  return MUST_NAME_FAMILY.has(category) ? undefined : FAMILIES.has(category) ? category : undefined;
}
