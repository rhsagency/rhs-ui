import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
/** A single eight-faced metal gem with crisp planar reflections. */
export const gemOcta = {
  "name": "gem-octa",
  "parts": [
    {
      "shape": "octahedron",
      "rotation": [
        0.15,
        0.35,
        0.12
      ],
      "roughness": 0.25
    }
  ]
} as const satisfies ModelRecipe;
