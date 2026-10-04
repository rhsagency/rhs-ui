"use client";

import { useState } from "react";

import { IconAlignCenter, IconAlignLeft, IconAlignRight, IconBold, IconItalic, IconLink, IconRedo, IconUnderline, IconUndo } from "@rhs-ui/icons";
import { Toolbar } from "@rhs-ui/primitives/toolbar";

export default function Demo(): React.JSX.Element {
  const [marks, setMarks] = useState<string[]>(["bold"]);
  const [align, setAlign] = useState("left");
  const mark = (id: string) => () => setMarks((list) => (list.includes(id) ? list.filter((item) => item !== id) : [...list, id]));
  return (
    <div className="mx-auto flex max-w-xl justify-center p-10">
      <Toolbar
        label="Text formatting"
        groups={[
          [
            { id: "undo", label: "Undo", icon: <IconUndo /> },
            { id: "redo", label: "Redo", icon: <IconRedo />, disabled: true },
          ],
          [
            { id: "bold", label: "Bold", icon: <IconBold />, pressed: marks.includes("bold"), onSelect: mark("bold") },
            { id: "italic", label: "Italic", icon: <IconItalic />, pressed: marks.includes("italic"), onSelect: mark("italic") },
            { id: "underline", label: "Underline", icon: <IconUnderline />, pressed: marks.includes("underline"), onSelect: mark("underline") },
          ],
          [
            { id: "left", label: "Align left", icon: <IconAlignLeft />, pressed: align === "left", onSelect: () => setAlign("left") },
            { id: "center", label: "Align centre", icon: <IconAlignCenter />, pressed: align === "center", onSelect: () => setAlign("center") },
            { id: "right", label: "Align right", icon: <IconAlignRight />, pressed: align === "right", onSelect: () => setAlign("right") },
          ],
          [{ id: "link", label: "Add link", icon: <IconLink /> }],
        ]}
      />
    </div>
  );
}
