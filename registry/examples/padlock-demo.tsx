"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { padlock } from "@rhs-ui/models/padlock";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={padlock} /></div>; }
