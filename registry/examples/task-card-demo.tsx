"use client";

import { useState } from "react";

import { TaskCard, TaskCardSkeleton, type TaskCardLabel, type TaskCardTask } from "@rhs-ui/application/task-card";
import { IconMessage, IconPaperclip } from "@rhs-ui/icons";

// A fixed "now" keeps the due dates the same on every load. In an app, leave `now` out and the cards read the browser's clock.
const NOW = Date.parse("2026-10-26T14:30:00Z");

const cover = (background: string, shapes: string) => ({
  src: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 180'><rect width='320' height='180' fill='${background}'/>${shapes}</svg>`),
  alt: "",
});

const label = (id: string): TaskCardLabel => ({ id, label: id });

interface Item {
  task: TaskCardTask;
  labels: readonly TaskCardLabel[];
  comments?: number;
  files?: number;
}

const PROGRESS: readonly Item[] = [
  {
    task: {
      id: "k1",
      title: "Product photography for the autumn range",
      href: "/tasks/k1",
      cover: cover("#e4e1da", "<rect y='128' width='320' height='52' fill='#d7d3ca'/><ellipse cx='160' cy='142' rx='98' ry='9' fill='#b8b3a8' opacity='.6'/><rect x='108' y='46' width='46' height='96' rx='10' fill='#8f897c'/><rect x='122' y='28' width='18' height='24' rx='4' fill='#6f6a5f'/><rect x='114' y='80' width='34' height='38' rx='4' fill='#e4e1da'/><rect x='176' y='86' width='66' height='56' rx='10' fill='#a29c8f'/><rect x='172' y='78' width='74' height='14' rx='6' fill='#6f6a5f'/><rect x='187' y='104' width='44' height='20' rx='3' fill='#e4e1da'/>"),
      due: "2026-10-29",
      subtasks: { done: 3, total: 8 },
      assignees: [{ name: "Sofia Rossi" }, { name: "Hana Sato" }],
    },
    labels: [label("Design"), label("Photography")],
    comments: 4,
    files: 12,
  },
  {
    task: {
      id: "k2",
      title: "Redirect map for 212 legacy URLs",
      href: "/tasks/k2",
      due: "2026-10-26",
      subtasks: { done: 4, total: 5 },
      assignees: [{ name: "Leo Martins" }, { name: "Dan Cho" }, { name: "Priya Nair" }, { name: "Mara Okafor" }, { name: "Tomas Brandt" }],
    },
    labels: [label("Engineering"), label("SEO")],
    comments: 9,
  },
  {
    task: {
      id: "k3",
      title: "Cookie banner wording in Dutch and German",
      href: "/tasks/k3",
      due: "2026-10-24",
      subtasks: { done: 1, total: 4 },
      assignees: [{ name: "Ines Kowalski" }],
    },
    labels: [label("Legal")],
    comments: 2,
  },
];

const REVIEW: readonly Item[] = [
  {
    task: {
      id: "k4",
      title: "Accessibility notes for the checkout, including the error summary and the focus order on the payment step",
      href: "/tasks/k4",
      due: "2026-11-02",
      assignees: [{ name: "Priya Nair" }, { name: "Marcus Webb" }],
    },
    labels: [label("Accessibility"), label("Checkout"), label("Review")],
    files: 3,
  },
  {
    task: { id: "k5", title: "Rollback rehearsal on staging", href: "/tasks/k5", done: true, completedAt: "2026-10-23T09:12:00Z", subtasks: { done: 3, total: 3 }, assignees: [{ name: "Tomas Brandt" }] },
    labels: [label("Engineering")],
  },
];

const meta = (item: Item) =>
  item.comments || item.files ? (
    <>
      {item.comments ? (
        <span className="inline-flex items-center gap-1 tabular-nums">
          <IconMessage aria-hidden="true" className="size-3.5" />
          {item.comments}
          <span className="sr-only"> comments</span>
        </span>
      ) : null}
      {item.files ? (
        <span className="inline-flex items-center gap-1 tabular-nums">
          <IconPaperclip aria-hidden="true" className="size-3.5" />
          {item.files}
          <span className="sr-only"> files</span>
        </span>
      ) : null}
    </>
  ) : undefined;

function Column({ title, count, children }: { title: string; count?: number; children: React.ReactNode }): React.JSX.Element {
  return (
    <section aria-label={title} className="rounded-xl bg-muted/50 p-2">
      <h2 className="flex items-center justify-between px-2 pt-1 pb-2.5 text-sm font-semibold tracking-[-0.01em]">
        {title}
        {count === undefined ? null : <span className="text-xs font-medium text-muted-foreground tabular-nums">{count}</span>}
      </h2>
      <ul className="grid gap-2">{children}</ul>
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [selected, setSelected] = useState("k3");
  const card = (item: Item, extra?: { dragging?: boolean }) => (
    <TaskCard
      key={item.task.id}
      task={item.task}
      labels={item.labels}
      now={NOW}
      selected={selected === item.task.id}
      dragging={extra?.dragging}
      footer={meta(item)}
      onOpen={(task, event) => {
        // A preview has nowhere to go: a router would navigate here.
        event.preventDefault();
        setSelected(task.id);
      }}
    />
  );

  return (
    <figure className="grid w-full max-w-4xl gap-3">
      <figcaption className="text-xs text-muted-foreground">The outlined card is selected, the tilted one is being dragged and the last column is still loading. Each card is one tab stop.</figcaption>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-x-4 gap-y-5">
        <Column title="In progress" count={PROGRESS.length}>
          {PROGRESS.map((item) => card(item))}
        </Column>
        <Column title="In review" count={REVIEW.length}>
          {card(REVIEW[1]!)}
          {card(REVIEW[0]!, { dragging: true })}
        </Column>
        <Column title="Loading">
          <TaskCardSkeleton cover />
          <TaskCardSkeleton />
        </Column>
      </div>
    </figure>
  );
}
