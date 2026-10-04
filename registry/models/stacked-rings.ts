import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
/** A compact column of five matching satin rings. */
export const stackedRings = {
  "name": "stacked-rings",
  "parts": [
    {
      "shape": "torus",
      "tube": 0.12,
      "position": [
        0,
        -0.48,
        0
      ],
      "rotation": [
        1.5707963267948966,
        0,
        0
      ],
      "roughness": 0.3
    },
    {
      "shape": "torus",
      "tube": 0.12,
      "position": [
        0,
        -0.24,
        0
      ],
      "rotation": [
        1.5707963267948966,
        0,
        0
      ],
      "roughness": 0.3
    },
    {
      "shape": "torus",
      "tube": 0.12,
      "position": [
        0,
        0,
        0
      ],
      "rotation": [
        1.5707963267948966,
        0,
        0
      ],
      "roughness": 0.3
    },
    {
      "shape": "torus",
      "tube": 0.12,
      "position": [
        0,
        0.24,
        0
      ],
      "rotation": [
        1.5707963267948966,
        0,
        0
      ],
      "roughness": 0.3
    },
    {
      "shape": "torus",
      "tube": 0.12,
      "position": [
        0,
        0.48,
        0
      ],
      "rotation": [
        1.5707963267948966,
        0,
        0
      ],
      "roughness": 0.3
    }
  ]
} as const satisfies ModelRecipe;
