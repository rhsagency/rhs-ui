import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
/** A single porcelain sphere with a soft studio finish. */
export const softSphere = {
  "name": "soft-sphere",
  "parts": [
    {
      "shape": "sphere",
      "color": "#deddd8",
      "metalness": 0.12,
      "roughness": 0.34
    }
  ]
} as const satisfies ModelRecipe;
