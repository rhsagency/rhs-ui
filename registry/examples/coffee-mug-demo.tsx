"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { coffeeMug } from "@rhs-ui/models/coffee-mug";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={coffeeMug} /></div>; }
