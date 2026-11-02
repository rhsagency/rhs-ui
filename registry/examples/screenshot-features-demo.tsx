import type { ReactNode } from "react";

import { ScreenshotFeatures, type ScreenshotFeature, type ScreenshotImage } from "@rhs-ui/marketing/screenshot-features";

/**
 * A product screenshot, drawn as an SVG so the demo needs no files. In a real page this is your own picture. The
 * drawing follows the light or dark setting of the browser, the way a screenshot with a dark and a light variant would.
 */
function screenshot(): string {
  const text = (x: number, y: number, size: number, cls: string, value: string, extra = "") => `<text x='${x}' y='${y}' font-size='${size}' class='${cls}' ${extra}>${value}</text>`;
  const rect = (x: number, y: number, w: number, h: number, rx: number, cls: string) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' rx='${rx}' class='${cls}'/>`;
  const circle = (x: number, y: number, r: number, cls: string) => `<circle cx='${x}' cy='${y}' r='${r}' class='${cls}'/>`;

  const tasks = [
    { title: "Review homepage copy with Maria", project: "Website relaunch", due: "9:30", selected: true },
    { title: "Send the Q4 plan to the board", project: "Q4 planning", due: "11:00" },
    { title: "Book five customer interviews", project: "Customer research", due: "12:15" },
    { title: "Approve the new logo set", project: "Brand guidelines", due: "14:00", done: true },
    { title: "Fix the pricing table on mobile", project: "Website relaunch", due: "15:30" },
    { title: "Write the October changelog", project: "Q4 planning", due: "16:45" },
    { title: "Plan the team offsite agenda", project: "Q4 planning", due: "17:30" },
  ];

  const body: string[] = [];
  // Sidebar
  body.push(rect(0, 0, 264, 1000, 0, "f-side"), rect(263, 0, 1, 1000, 0, "f-line"));
  body.push(rect(24, 26, 30, 30, 9, "f-acc"), text(39, 47, 17, "f-accink", "K", "text-anchor='middle' font-weight='700'"), text(66, 48, 18, "f-ink", "Kestrel", "font-weight='600'"));
  body.push(rect(20, 84, 224, 38, 10, "f-bg s-line"), circle(40, 102, 6, "n-stroke"), `<path d='M45 107l5 5' class='n-stroke'/>`, text(62, 108, 14, "f-mute", "Search"));
  const nav = [
    { name: "Inbox", count: "12", y: 164 },
    { name: "Today", count: "7", y: 204, active: true },
    { name: "Upcoming", count: "", y: 244 },
    { name: "Completed", count: "", y: 284 },
  ];
  for (const item of nav) {
    if (item.active) body.push(rect(12, item.y - 22, 240, 38, 10, "f-chip"));
    body.push(rect(30, item.y - 11, 16, 16, 5, "n-stroke"), text(62, item.y + 2, 15, "f-ink", item.name, item.active ? "font-weight='600'" : ""));
    if (item.count) body.push(text(232, item.y + 2, 13, "f-mute", item.count, "text-anchor='end'"));
  }
  body.push(text(26, 356, 12, "f-mute", "PROJECTS", "letter-spacing='1.4' font-weight='600'"));
  const projects = [
    { name: "Website relaunch", count: "8/14", y: 396, tone: "f-acc" },
    { name: "Q4 planning", count: "5/9", y: 436, tone: "f-mute" },
    { name: "Customer research", count: "2/10", y: 476, tone: "f-line" },
    { name: "Brand guidelines", count: "11/12", y: 516, tone: "f-mute" },
  ];
  for (const project of projects) body.push(circle(38, project.y - 4, 5, project.tone), text(58, project.y, 15, "f-ink", project.name), text(232, project.y, 13, "f-mute", project.count, "text-anchor='end'"));
  body.push(circle(40, 954, 17, "f-chip"), text(40, 959, 12, "f-ink", "MJ", "text-anchor='middle' font-weight='600'"), text(66, 951, 14, "f-ink", "Maria Jansen", "font-weight='600'"), text(66, 970, 12, "f-mute", "Studio plan"));

  // Main list
  body.push(text(312, 96, 34, "f-ink", "Today", "font-weight='650' letter-spacing='-0.8'"), text(312, 128, 15, "f-mute", "Tuesday 27 October, 7 tasks and 6 hours planned"));
  body.push(rect(940, 62, 142, 42, 11, "f-acc"), text(1011, 89, 14, "f-accink", "New task", "text-anchor='middle' font-weight='600'"));
  body.push(rect(312, 164, 54, 34, 17, "f-chip"), text(339, 186, 14, "f-ink", "All", "text-anchor='middle' font-weight='600'"));
  body.push(rect(376, 164, 148, 34, 17, "f-bg s-line"), text(450, 186, 14, "f-mute", "Assigned to me", "text-anchor='middle'"));
  body.push(rect(534, 164, 132, 34, 17, "f-bg s-line"), text(600, 186, 14, "f-mute", "High priority", "text-anchor='middle'"));
  tasks.forEach((task, index) => {
    const y = 236 + index * 96;
    if (task.selected) body.push(rect(288, y - 8, 776, 84, 14, "f-soft"), rect(288, y + 8, 4, 52, 2, "f-acc"));
    if (task.done) body.push(rect(316, y + 14, 26, 26, 8, "f-acc"), `<path d='M323 ${y + 27}l5 5 9-10' class='check'/>`);
    else body.push(rect(317, y + 15, 24, 24, 7, "s-check f-none"));
    body.push(text(364, y + 34, 18, task.done ? "f-mute" : "f-ink", task.title, task.done ? "text-decoration='line-through'" : "font-weight='550'"));
    body.push(circle(369, y + 56, 4, "f-mute"), text(382, y + 61, 14, "f-mute", task.project));
    body.push(text(1030, y + 34, 15, "f-mute", task.due, "text-anchor='end'"));
    if (index !== tasks.length - 1) body.push(rect(316, y + 78, 720, 1, 0, "f-line"));
  });

  // Detail panel
  body.push(rect(1090, 0, 1, 1000, 0, "f-line"));
  body.push(text(1130, 72, 14, "f-mute", "Website relaunch  /  Homepage"));
  body.push(circle(1536, 66, 3, "f-mute"), circle(1550, 66, 3, "f-mute"), circle(1564, 66, 3, "f-mute"));
  body.push(text(1130, 130, 28, "f-ink", "Review homepage copy", "font-weight='650' letter-spacing='-0.5'"), text(1130, 166, 28, "f-ink", "with Maria", "font-weight='650' letter-spacing='-0.5'"));
  const meta: [string, string][] = [
    ["Assignee", "Maria Jansen"],
    ["Due", "Today, 9:30"],
    ["Project", "Website relaunch"],
    ["Priority", "High"],
  ];
  meta.forEach(([label, value], index) => {
    const y = 236 + index * 46;
    body.push(text(1130, y, 14, "f-mute", label));
    if (label === "Assignee") body.push(circle(1272, y - 5, 11, "f-chip"), text(1292, y, 14, "f-ink", value));
    else if (label === "Priority") body.push(rect(1260, y - 20, 62, 28, 14, "f-chip"), text(1291, y - 1, 13, "f-ink", value, "text-anchor='middle' font-weight='600'"));
    else body.push(text(1260, y, 14, "f-ink", value));
  });
  body.push(rect(1130, 430, 430, 1, 0, "f-line"));
  body.push(text(1130, 472, 14, "f-ink", "Subtasks", "font-weight='600'"), text(1560, 472, 13, "f-mute", "3 of 5", "text-anchor='end'"));
  body.push(rect(1130, 488, 430, 8, 4, "f-chip"), rect(1130, 488, 258, 8, 4, "f-acc"));
  const subtasks = [
    ["Headline and hero text", true],
    ["Pricing page", true],
    ["Footer links", true],
    ["Legal pages", false],
    ["Final read-through", false],
  ] as const;
  subtasks.forEach(([label, done], index) => {
    const y = 540 + index * 38;
    if (done) body.push(rect(1130, y - 15, 20, 20, 6, "f-acc"), `<path d='M1135 ${y - 5}l4 4 7-8' class='check small'/>`);
    else body.push(rect(1131, y - 14, 18, 18, 5, "s-check f-none"));
    body.push(text(1164, y, 14, done ? "f-mute" : "f-ink", label));
  });
  body.push(rect(1130, 744, 430, 1, 0, "f-line"));
  body.push(text(1130, 782, 14, "f-ink", "Comments", "font-weight='600'"));
  body.push(circle(1146, 826, 16, "f-chip"), text(1146, 831, 11, "f-ink", "TB", "text-anchor='middle' font-weight='600'"), text(1174, 822, 14, "f-ink", "Tomas Berg", "font-weight='600'"), text(1560, 822, 12, "f-mute", "10 min ago", "text-anchor='end'"));
  body.push(text(1174, 848, 14, "f-ink", "The new hero line reads well. Can we shorten"), text(1174, 868, 14, "f-ink", "the second paragraph a little?"));
  body.push(rect(1130, 896, 430, 52, 13, "f-bg s-line"), text(1152, 928, 14, "f-mute", "Write a comment"), circle(1530, 922, 14, "f-acc"), `<path d='M1524 922h12m-5-5l5 5-5 5' class='check small'/>`);

  const style = `
    :root{--bg:#ffffff;--side:#f6f6f6;--line:#e5e5e5;--ink:#161616;--mute:#757575;--chip:#eeeeee;--acc:#161616;--accink:#ffffff;--soft:#f7f7f7;--check:#bdbdbd}
    @media (prefers-color-scheme:dark){:root{--bg:#151515;--side:#101010;--line:#2a2a2a;--ink:#f0f0f0;--mute:#9b9b9b;--chip:#242424;--acc:#f0f0f0;--accink:#151515;--soft:#1b1b1b;--check:#555555}}
    text{font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
    .f-bg{fill:var(--bg)}.f-side{fill:var(--side)}.f-line{fill:var(--line)}.f-ink{fill:var(--ink)}.f-mute{fill:var(--mute)}.f-chip{fill:var(--chip)}.f-acc{fill:var(--acc)}.f-accink{fill:var(--accink)}.f-soft{fill:var(--soft)}.f-none{fill:none}
    .s-line{stroke:var(--line);stroke-width:1.5}.s-check{stroke:var(--check);stroke-width:2}
    .n-stroke{fill:none;stroke:var(--mute);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    .check{fill:none;stroke:var(--accink);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}.check.small{stroke-width:2.2}
  `;
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000'><style>${style}</style>${rect(0, 0, 1600, 1000, 0, "f-bg")}${body.join("")}</svg>`;
}

const toUri = (svg: string) => "data:image/svg+xml;utf8," + encodeURIComponent(svg);

/** Three tones at a few dozen bytes: the sidebar, the list and the panel. It stands in, blurred, while the screenshot arrives. */
const blur = toUri(
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10'><style>:root{--a:#f6f6f6;--b:#ffffff;--c:#fafafa}@media (prefers-color-scheme:dark){:root{--a:#101010;--b:#151515;--c:#131313}}</style><rect width='16' height='10' fill='var(--b)'/><rect width='2.6' height='10' fill='var(--a)'/><rect x='11' width='5' height='10' fill='var(--c)'/></svg>`,
);

const image: ScreenshotImage = {
  src: toUri(screenshot()),
  alt: "The Kestrel Today view: a list of seven tasks for the day on the left, and on the right the open task with its owner, due time, subtasks and comments.",
  width: 1600,
  height: 1000,
  title: "kestrel.app/today",
  blurDataUrl: blur,
  sizes: "(min-width: 1152px) 1104px, calc(100vw - 48px)",
  priority: true,
};

/** The marks sit on empty canvas next to what they are about, so no width of the screenshot has a number over its text. */
const features: ScreenshotFeature[] = [
  { title: "One list for today", description: "Everything due today in one calm list, in the order you will do it, with the count in the sidebar.", href: "#today", marker: { x: 33, y: 5 } },
  { title: "Every task has context", description: "Open a task to see its owner, due time, subtasks and project without leaving the list.", href: "#tasks", marker: { x: 95.5, y: 13 } },
  { title: "Comments stay with the work", description: "Discuss a task where it lives. The thread is saved with it, so nobody asks where a decision was made.", href: "#comments", marker: { x: 91, y: 74 } },
  { title: "Projects at a glance", description: "Your projects sit in the sidebar with their progress, so a slipping one is the first thing you see.", href: "#projects", marker: { x: 14, y: 32 } },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-8 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Four features: each column is numbered, and its number is marked on the screenshot where the feature lives">
        <ScreenshotFeatures eyebrow="The product" title="See how your week comes together" description="Kestrel keeps the plan, the people and the conversation on one screen." screenshot={image} features={features} />
      </Example>
      <div className="mx-auto mt-24 max-w-2xl border-t border-border pt-12">
        <Example caption="In a narrower column, with three features and no marks: the columns stack and the screenshot keeps the full width">
          <ScreenshotFeatures headingLevel={3} title="Plan with your whole team" screenshot={{ ...image, priority: false }} features={features.slice(0, 3).map(({ marker: _marker, ...feature }) => feature)} />
        </Example>
      </div>
    </div>
  );
}
