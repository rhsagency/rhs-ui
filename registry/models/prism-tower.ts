import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
/** A tall softened graphite pillar for minimal spatial layouts. */
export const prismTower = {
  "name": "prism-tower",
  "parts": [
    {
      "shape": "box",
      "scale": [
        0.48,
        1.4,
        0.48
      ],
      "color": "#64686b",
      "roughness": 0.3
    }
  ]
} as const satisfies ModelRecipe;
