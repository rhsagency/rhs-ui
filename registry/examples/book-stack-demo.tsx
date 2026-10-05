"use client";
import { ModelViewer } from "@rhs-ui/models/model-viewer";
import { bookStack } from "@rhs-ui/models/book-stack";
export default function ModelDemo(): React.JSX.Element { return <div className="w-full max-w-sm p-4"><ModelViewer model={bookStack} /></div>; }
