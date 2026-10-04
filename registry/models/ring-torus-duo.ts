import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
/** Two interlocked satin rings forming a simple chain link. */
export const ringTorusDuo = {
  "name": "ring-torus-duo",
  "parts": [
    {
      "shape": "torus",
      "tube": 0.16,
      "position": [
        -0.56,
        0,
        0
      ],
      "scale": [
        0.75,
        0.75,
        0.75
      ]
    },
    {
      "shape": "torus",
      "tube": 0.16,
      "position": [
        0.56,
        0,
        0
      ],
      "rotation": [
        1.5707963267948966,
        0,
        0
      ],
      "scale": [
        0.75,
        0.75,
        0.75
      ]
    }
  ]
} as const satisfies ModelRecipe;
