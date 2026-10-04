import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
/** A single flattened porcelain pebble with a gently tilted silhouette. */
export const satinPebble = {
  "name": "satin-pebble",
  "parts": [
    {
      "shape": "sphere",
      "scale": [
        1.2,
        0.58,
        0.85
      ],
      "rotation": [
        0.2,
        0,
        0.15
      ],
      "color": "#dad8d2",
      "metalness": 0.15,
      "roughness": 0.33
    }
  ]
} as const satisfies ModelRecipe;
