import { PressReleaseList } from "@rhs-ui/marketing/press-release-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <PressReleaseList
        title="Press releases"
        description="Announcements from Northwind, newest first. Each one is also a PDF you can attach to a story."
        boilerplate="Northwind builds scheduling and dispatch software for field service teams. More than 10,000 companies, from two-person plumbing firms to national elevator maintainers, use it to plan work, route technicians and invoice jobs. Founded in 2021, Northwind has offices in Amsterdam and Austin and employs 240 people."
        boilerplateTitle="About Northwind"
        contact={{
          name: "Priya Raman",
          role: "Head of communications",
          email: "press@northwind.example",
          phone: "+31 20 555 0142",
          responseTime: "Usually replies within two hours, Monday to Friday.",
        }}
        releases={[
          { title: "Northwind opens its first European data centre in Frankfurt", href: "#frankfurt", date: "14 Oct", dateTime: "2026-10-14", tag: "Product", pdfHref: "#frankfurt.pdf", pdfSize: "214 KB" },
          { title: "Northwind appoints Lena Marchetti as Chief Financial Officer", href: "#cfo", date: "2 Sep", dateTime: "2026-09-02", tag: "People", pdfHref: "#cfo.pdf", pdfSize: "188 KB" },
          { title: "Northwind raises $42 million Series B to bring field service to mid-sized teams", href: "#series-b", date: "18 Jun", dateTime: "2026-06-18", tag: "Funding", pdfHref: "#series-b.pdf", pdfSize: "236 KB" },
          { title: "Northwind and Kestrel Logistics announce a route-planning partnership", href: "#kestrel", date: "10 Mar", dateTime: "2026-03-10", tag: "Partnership" },
          { title: "Northwind passes 10,000 customers, one year after launching in Europe", href: "#ten-thousand", date: "4 Nov", dateTime: "2025-11-04", tag: "Company", pdfHref: "#ten-thousand.pdf", pdfSize: "172 KB" },
          { title: "Northwind launches Atlas, a scheduling engine that plans a week in under a second", href: "#atlas", date: "23 Sep", dateTime: "2025-09-23", tag: "Product", pdfHref: "#atlas.pdf", pdfSize: "1.2 MB" },
          { title: "Northwind earns SOC 2 Type II and ISO 27001 certification", href: "#certification", date: "13 May", dateTime: "2025-05-13", tag: "Company", pdfHref: "#certification.pdf", pdfSize: "144 KB" },
          { title: "Northwind welcomes Mateo Okafor as VP of Engineering", href: "#vp-engineering", date: "4 Feb", dateTime: "2025-02-04", tag: "People" },
          { title: "Northwind opens an Amsterdam office and hires its first thirty people", href: "#amsterdam", date: "15 Oct", dateTime: "2024-10-15", tag: "Company", pdfHref: "#amsterdam.pdf", pdfSize: "161 KB" },
          { title: "Northwind announces a $12 million Series A led by Halcyon Ventures", href: "#series-a", date: "19 Mar", dateTime: "2024-03-19", tag: "Funding", pdfHref: "#series-a.pdf", pdfSize: "198 KB" },
        ]}
      />

      <p className="mt-20 mb-6 text-xs text-muted-foreground">Only the list: dates are written from dateTime in en-GB, and a release without a PDF has no link</p>
      <PressReleaseList
        headingLevel={3}
        locale="en-GB"
        releases={[
          { title: "Kestrel Logistics moves its depot network to carbon-neutral delivery vans", href: "#vans", dateTime: "2026-08-27", tag: "Sustainability", pdfHref: "#vans.pdf", pdfSize: "256 KB" },
          { title: "Kestrel Logistics names Joanna Whitlock as managing director for the UK", href: "#md", dateTime: "2026-05-06", tag: "People" },
          { title: "Kestrel Logistics adds same-day delivery in Leeds and Sheffield", href: "#same-day", dateTime: "2026-01-21", tag: "Service", pdfHref: "#same-day.pdf", pdfSize: "139 KB" },
        ]}
      />
    </div>
  );
}
