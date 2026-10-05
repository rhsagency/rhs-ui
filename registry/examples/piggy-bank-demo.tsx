"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { piggyBank } from "@rhs-ui/models/piggy-bank";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={piggyBank} /></div>; }
