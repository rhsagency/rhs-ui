import type { ModelRecipe } from "@rhs-ui/models/model-viewer";
import { paintBucketAsset } from "./assets/paintBucket";
export const paintBucket = { name: "paint-bucket", parts: [], assets: [{ url: paintBucketAsset }] } as const satisfies ModelRecipe;
