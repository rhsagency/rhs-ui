import { AccessibilityStatement } from "@rhs-ui/marketing/accessibility-statement";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <AccessibilityStatement
        title="Accessibility statement"
        description="Northwind wants everyone to be able to use its website and its product. This is where we stand today, what is still wrong and when we will fix it."
        standard="WCAG 2.2"
        level="AA"
        status="partial"
        assessed={{ label: "12 September 2026", dateTime: "2026-09-12" }}
        method="Self-assessment by our design systems team: automated checks on every page template, manual keyboard and zoom tests, and screen reader tests with NVDA on Windows and VoiceOver on macOS and iOS. An independent audit covered the sign-in and checkout flows."
        works={[
          "Every page can be used with a keyboard alone, and the focus is always visible.",
          "Text and controls meet the contrast ratios for level AA in the light and the dark theme.",
          "Pages work at 400% zoom and at a width of 320 pixels without scrolling sideways.",
          "Forms have visible labels and say in words what went wrong and how to put it right.",
          "Motion follows the reduced motion setting of your device.",
        ]}
        limitations={[
          {
            area: "Captions on videos from before 2024",
            issue: "About 40 older product videos have no captions or transcript. This affects people who are deaf or hard of hearing.",
            workaround: "Write to access@northwind.example and we will send you a transcript within two working days.",
            fixBy: { label: "31 March 2027", dateTime: "2027-03-31" },
          },
          {
            area: "Charts in the reports section",
            issue: "Charts are images with a short text alternative, so people who use a screen reader cannot explore the individual data points.",
            workaround: "Every chart has a Download data link that gives you the numbers as a CSV file.",
            fixBy: { label: "30 June 2027", dateTime: "2027-06-30" },
          },
          {
            area: "Drag and drop on the planning board",
            issue: "Moving a job to another day needs a mouse or a touch screen. The older planning board has no keyboard way to do it.",
            workaround: "Open the job and choose Reschedule, which works with the keyboard.",
            fixBy: "First quarter of 2027",
          },
        ]}
        technologies={["HTML", "WAI-ARIA", "CSS", "JavaScript", "SVG", "PDF"]}
        contact={{
          email: "access@northwind.example",
          phone: "+31 20 555 0188",
          form: { href: "#feedback", label: "Use the accessibility feedback form" },
          responseTime: "We reply within five working days.",
          note: "Tell us the page, what you were trying to do, and the browser and assistive technology you use. It helps us find the problem faster.",
        }}
        enforcement={{
          body: "The Digital Accessibility Complaints Board",
          href: "#complaints",
          text: "If our answer does not solve the problem, or you have not heard from us within a month, you can complain to:",
        }}
      />

      <p className="mt-20 mb-6 text-xs text-muted-foreground">A site that meets the standard: the heading says so, and the limitations section says there are none</p>
      <AccessibilityStatement
        headingLevel={3}
        subject="halcyon.example"
        standard="WCAG 2.2"
        level="AA"
        status="full"
        assessed={{ label: "3 October 2026", dateTime: "2026-10-03" }}
        method="Independent audit by Accessibly Ltd. of all 38 page templates, repeated after every redesign."
        limitations={[]}
        contact={{ email: "hello@halcyon.example", responseTime: "We reply within three working days." }}
      />
    </div>
  );
}
