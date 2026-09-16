import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
export const crystalPrism = {
  "name": "crystal-prism",
  "parts": [
    {
      "shape": "octahedron",
      "scale": [
        0.85,
        1.65,
        0.85
      ],
      "rotation": [
        0.1,
        0.25,
        0.1
      ],
      "color": "#858585",
      "metalness": 1,
      "roughness": 0.12
    }
  ]
} as const satisfies ModelRecipe;
