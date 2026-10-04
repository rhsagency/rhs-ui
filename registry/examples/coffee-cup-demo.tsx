"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { coffeeCup } from "@rhs-ui/models/coffee-cup";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={coffeeCup} /></div>; }
