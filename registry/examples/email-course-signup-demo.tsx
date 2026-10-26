"use client";

import type { ReactNode } from "react";

import { EmailCourseSignup, type CourseLesson } from "@rhs-ui/marketing/email-course-signup";

const lessons: CourseLesson[] = [
  { day: 1, title: "The one metric that matters", takeaway: "Choose the single number that tells you whether your price is working, and stop watching the rest." },
  { day: 2, title: "What customers would actually pay", takeaway: "Three questions that surface a real number instead of a polite one." },
  { day: 3, title: "The middle plan does the work", takeaway: "Why the plan you want people to choose goes second, and how to show it." },
  { day: 4, title: "Raising prices without losing people", takeaway: "A message to send, a date to give and what to say to the ones who push back." },
  { day: 5, title: "A pricing page you can ship on Friday", takeaway: "Turn the four lessons into one page, with a checklist to test it before it goes live." },
];

const shared = {
  lessons,
  title: "Price your software in five emails",
  description: "One short email a day, each with one idea and one exercise. Written for founders who set a price once, on a guess, and never looked at it again.",
  duration: "5 minutes a day",
  privacyHref: "#privacy",
  locale: "en-GB",
  timeZone: "Europe/Amsterdam",
} as const;

/** Tomorrow as a plain day, the way a server that sends in the morning would answer. */
const enrol = () =>
  new Promise<{ firstLessonAt: string }>((resolve) =>
    setTimeout(() => resolve({ firstLessonAt: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10) }), 800),
  );

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-6 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="Try it: the outline is a real ordered list, and signing up tells you the day Day 1 arrives">
        <EmailCourseSignup {...shared} onSubmit={enrol} />
      </Example>
      <div className="mt-16 border-t border-border pt-12">
        <Example caption="When your server names the time, the confirmation says it, with the time zone">
          <EmailCourseSignup
            {...shared}
            headingLevel={3}
            title="Price your software in three emails"
            lessons={lessons.slice(0, 3)}
            onSubmit={enrol}
            defaultStatus="done"
            defaultValue="maria@halcyon.studio"
            defaultStart={{ firstLessonAt: "2026-10-29T07:00:00+01:00" }}
          />
        </Example>
      </div>
    </div>
  );
}
