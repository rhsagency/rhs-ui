"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { crystalPrism } from "@rhs-ui/models/crystal-prism";
export default function Demo(): React.JSX.Element { return <ModelViewer model={crystalPrism} />; }
