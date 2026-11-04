// What kind of part a registry item is, in the component index (component-index-file.mjs). RHS Orbit groups its Pro
// catalogue with the same rule, so a Free and a Pro item of one kind sit together.

export const KIND_ORDER = ["template", "block", "background", "model", "motion", "component", "primitive"];

export function kindOf(item) {
  const category = item.categories?.[0];
  if (item.type === "registry:block") return category === "templates" ? "template" : "block";
  if (item.type === "registry:component") {
    if (category === "backgrounds") return "background";
    if (category === "models") return "model";
    if (category === "motion") return "motion";
    return "component";
  }
  if (item.type === "registry:ui" && category !== "icons") return "primitive";
  return null;
}
