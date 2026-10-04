import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
/** A single satin capsule with softly rounded ends. */
export const pillCapsule = {
  "name": "pill-capsule",
  "parts": [
    {
      "shape": "capsule",
      "rotation": [
        0,
        0,
        -0.45
      ],
      "roughness": 0.3
    }
  ]
} as const satisfies ModelRecipe;
