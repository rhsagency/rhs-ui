import type { ReactNode } from "react";

import { PropsTable, type PropRow } from "@rhs-ui/application/props-table";

const DATA_TABLE: readonly PropRow[] = [
  {
    group: "Data",
    name: "columns",
    type: "Column<Row>[]",
    required: true,
    description: "What to show, left to right. Each column reads one key of a row.",
    children: [
      { name: "key", type: "keyof Row", required: true, description: "Which key of a row this column shows." },
      { name: "header", type: "string", required: true, description: "The heading. It is also the name of the column for screen readers." },
      { name: "align", type: "'start' | 'end'", defaultValue: "'start'", description: "Numbers read best aligned to the end." },
      { name: "sortable", type: "boolean", defaultValue: "false", description: "Adds a sort button to the heading." },
      { name: "width", type: "number | `${number}%`", description: "A fixed width in pixels or a share of the table. Without one the column takes what is left." },
    ],
  },
  { group: "Data", name: "rows", type: "Row[]", required: true, description: "The rows to show. Pass a new array to change them, and keep each row's identity stable." },
  {
    group: "Data",
    name: "getRowId",
    type: "(row: Row) => string",
    defaultValue: "(row) => row.id",
    description: (
      <>
        Reads the identity of a row. It is the React <code>key</code> and what a selection refers to.
      </>
    ),
  },
  { group: "Data", name: "pageSize", type: "10 | 25 | 50 | 100", defaultValue: "25", description: "How many rows a page holds. A number outside the list is rounded to the nearest." },
  { group: "Appearance", name: "density", type: "'compact' | 'comfortable' | 'spacious'", defaultValue: "'comfortable'", description: "The height of a row: 32, 40 or 52 pixels." },
  { group: "Appearance", name: "stickyHeader", type: "boolean", defaultValue: "false", description: "Keeps the header in view while the rows scroll beneath it." },
  {
    group: "Appearance",
    name: "emptyState",
    type: "ReactNode | ((search: string) => ReactNode)",
    description: (
      <>
        Shown when there are no rows. A function gets the search that emptied the table, so it can offer to clear it.
      </>
    ),
  },
  {
    group: "Events",
    name: "selection",
    type: "SelectionConfig | false",
    defaultValue: "false",
    description: "Turns on a checkbox column. Controlled: you own the selected ids.",
    children: [
      { name: "mode", type: "'single' | 'multiple'", required: true, description: "One row at a time, or any number." },
      { name: "value", type: "readonly string[]", required: true, description: "The ids of the selected rows." },
      { name: "onChange", type: "(ids: string[]) => void", required: true, description: "Called with the new ids whenever someone selects or clears a row." },
    ],
  },
  {
    group: "Events",
    name: "onSortChange",
    type: "(sort: { key: keyof Row; direction: 'asc' | 'desc' } | null) => void",
    description: "Called when a sortable heading is pressed. Null means the sort was cleared.",
  },
];

const TOAST: readonly PropRow[] = [
  { name: "title", type: "string", required: true, description: "What happened, in a few words. It is read out as soon as the toast appears." },
  { name: "description", type: "string", description: "One more sentence, if the title is not enough." },
  { name: "tone", type: "'neutral' | 'success' | 'destructive'", defaultValue: "'neutral'", description: "Says what kind of news it is, with an icon as well as colour." },
  { name: "duration", type: "number", defaultValue: "5000", description: "How long it stays, in milliseconds. A toast with an action stays until it is dismissed." },
  {
    name: "action",
    type: "ToastAction",
    description: "A button inside the toast, for undoing what just happened.",
    children: [
      { name: "label", type: "string", required: true, description: "What the button says: Undo." },
      { name: "onClick", type: "() => void", required: true, description: "Runs when it is pressed. The toast closes after it." },
    ],
  },
];

function Section({ title, summary, children }: { title: string; summary: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0">
      <h2 className="text-xl font-semibold tracking-[-0.02em]">{title}</h2>
      <p className="mt-1.5 mb-5 max-w-2xl text-sm text-muted-foreground">{summary}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-14 px-4 py-10 sm:px-6">
      <Section
        title="DataTable"
        summary={
          <>
            A sortable, selectable table for the rows of one thing. Props are listed under their headings; <code className="font-mono text-[0.8125rem] text-foreground">columns</code> and{" "}
            <code className="font-mono text-[0.8125rem] text-foreground">selection</code> take objects, whose fields open beneath them.
          </>
        }
      >
        <PropsTable caption="DataTable props" rows={DATA_TABLE} idPrefix="data-table-" defaultExpanded={["columns"]} />
      </Section>

      <Section title="Toast" summary="A short message that stays out of the way. Without groups, with one object prop, and its own link prefix so the two tables do not share ids.">
        <PropsTable caption="Toast props" rows={TOAST} idPrefix="toast-" defaultExpanded={["action"]} />
      </Section>
    </div>
  );
}
