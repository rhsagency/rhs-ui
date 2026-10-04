import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
/** An unmarked satin coin with a clean circular face. */
export const coinBlank = {
  "name": "coin-blank",
  "parts": [
    {
      "shape": "cylinder",
      "scale": [
        1,
        0.45,
        1
      ],
      "rotation": [
        1.2,
        0.6,
        0.1
      ],
      "roughness": 0.3
    }
  ]
} as const satisfies ModelRecipe;
