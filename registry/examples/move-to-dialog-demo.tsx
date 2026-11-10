"use client";

import { useRef, useState, type ReactNode } from "react";

import { MoveToDialog, MoveToPanel, type FolderNode } from "@rhs-ui/application/move-to-dialog";
import { IconCopy, IconFileText, IconFolder, IconImage } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const TREE: readonly FolderNode[] = [
  {
    id: "projects",
    name: "Projects",
    children: [
      {
        id: "p2025",
        name: "2025",
        children: [
          { id: "atlas", name: "Atlas rebrand" },
          { id: "orchard", name: "Orchard launch" },
        ],
      },
      {
        id: "p2026",
        name: "2026",
        children: [
          {
            id: "halcyon",
            name: "Halcyon",
            children: [
              { id: "brand", name: "Brand" },
              { id: "launch", name: "Launch", children: [{ id: "press", name: "Press kit" }] },
              {
                id: "research",
                name: "Research",
                children: [
                  { id: "interviews", name: "Interviews" },
                  { id: "survey", name: "Survey" },
                ],
              },
            ],
          },
          { id: "kestrel", name: "Kestrel" },
          { id: "relaunch", name: "Northwind relaunch" },
        ],
      },
    ],
  },
  {
    id: "marketing",
    name: "Marketing",
    children: [
      { id: "campaigns", name: "Campaigns", children: [{ id: "autumn", name: "Autumn sale" }, { id: "spring", name: "Spring preview" }] },
      { id: "newsletter", name: "Newsletter" },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    disabled: true,
    reason: "You can only view this folder",
    children: [
      { id: "invoices", name: "Invoices" },
      { id: "receipts", name: "Receipts" },
    ],
  },
  { id: "archive", name: "Archive", children: [{ id: "a2024", name: "2024" }, { id: "a2023", name: "2023" }] },
  { id: "shared", name: "Shared", children: [{ id: "templates", name: "Templates" }, { id: "assets", name: "Brand assets" }] },
];

function nameOf(id: string, list: readonly FolderNode[] = TREE, trail: string[] = []): string | null {
  for (const node of list) {
    if (node.id === id) return [...trail, node.name].join(" / ");
    const below = node.children ? nameOf(id, node.children, [...trail, node.name]) : null;
    if (below) return below;
  }
  return null;
}

const ITEMS = [
  { icon: <IconFolder />, name: "Research", note: "Folder, 2 subfolders" },
  { icon: <IconFileText />, name: "Interview guide.pdf", note: "PDF, 482 KB" },
  { icon: <IconImage />, name: "Moodboard-v3.png", note: "Image, 3.1 MB" },
] as const;

export default function Demo(): React.JSX.Element {
  const [where, setWhere] = useState<string | null>(null);
  const [location, setLocation] = useState("Projects / 2026 / Halcyon");
  const [last, setLast] = useState("");
  const tries = useRef(0);
  const made = useRef(0);
  // The pretend drive knows the folders that were made in the dialog by their path.
  const madeAt = useRef(new Map<string, string>());

  // The first move fails, to show where the message goes and that the dialog stays.
  const move = (copy: boolean) => async (id: string) => {
    await wait(900);
    if (!copy && tries.current++ === 0) throw new Error("The drive did not answer, so nothing was moved.");
    const to = nameOf(id) ?? madeAt.current.get(id) ?? id;
    if (!copy) {
      setWhere(to);
      setLocation(to);
    }
    setLast(`${copy ? "Copied" : "Moved"} 3 items to ${to}.`);
  };
  const create = async (parentId: string | null, name: string) => {
    await wait(600);
    if (name.toLowerCase() === "reserved") throw new Error("That name is reserved by the workspace.");
    made.current += 1;
    const id = `made-${made.current}`;
    const parent = parentId ? (nameOf(parentId) ?? madeAt.current.get(parentId)) : null;
    madeAt.current.set(id, parent ? `${parent} / ${name}` : name);
    return { id, name };
  };

  return (
    <div className="grid w-full gap-10">
      <Case caption="Three items are selected in Halcyon. Choose Move to: the folder they are in says Already here, the folder being moved (and everything inside it) cannot take itself, and Finance is view-only. Type in the search, or press New folder to name one under your selection. The first move fails, so you can see how a failure reads.">
        <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-3 sm:px-5">
            <div className="grid min-w-0 gap-0.5">
              <h2 className="text-sm font-semibold tracking-[-0.01em]">3 items selected</h2>
              <p className="truncate text-xs text-muted-foreground">in {where ?? location}</p>
            </div>
            <div className="flex items-center gap-2">
              <MoveToDialog
                trigger={
                  <Button variant="outline" size="sm">
                    <IconCopy />
                    Copy to
                  </Button>
                }
                mode="copy"
                folders={TREE}
                currentFolderId="halcyon"
                movingIds={["research"]}
                itemCount={3}
                onMove={move(true)}
                onCreateFolder={create}
              />
              <MoveToDialog
                trigger={<Button size="sm">Move to…</Button>}
                folders={TREE}
                currentFolderId="halcyon"
                movingIds={["research"]}
                itemCount={3}
                onMove={move(false)}
                onCreateFolder={create}
              />
            </div>
          </div>
          <ul className="divide-y divide-border">
            {ITEMS.map((item) => (
              <li key={item.name} className="flex items-center gap-3 px-4 py-2.5 text-sm sm:px-5">
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted text-muted-foreground [&_svg]:size-4">
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{item.note}</span>
              </li>
            ))}
          </ul>
        </div>
        <p aria-live="polite" className="min-h-4 text-xs text-muted-foreground">
          {last}
        </p>
      </Case>

      <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2 md:items-start">
        <Case caption="The dialog's inside, with a destination chosen. The foot spells the path out and the button names the folder.">
          <Surface>
            <MoveToPanel
              standalone
              folders={TREE}
              currentFolderId="halcyon"
              movingIds={["research"]}
              itemCount={3}
              defaultValue="launch"
              onMove={() => undefined}
              onCreateFolder={() => undefined}
              className="max-h-[40rem]"
            />
          </Surface>
        </Case>
        <Case caption="Searching: only the folders that match show, with the branches they sit in open. Copying has a different title and foot, and a copy may go beside its original.">
          <Surface>
            <MoveToPanel standalone mode="copy" folders={TREE} currentFolderId="halcyon" movingIds={["research"]} itemCount={3} defaultQuery="re" defaultValue="relaunch" onMove={() => undefined} className="max-h-[40rem]" />
          </Surface>
        </Case>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The dialog a panel sits in, drawn flat so the panel is seen in its place. */
function Surface({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="w-full min-w-0 overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-sm">{children}</div>;
}
