import { IconChartBar, IconHome, IconReceipt, IconSettings, IconUsers } from "@rhs-ui/icons";
import { DashboardHero } from "@rhs-ui/marketing/dashboard-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-8 text-xs text-muted-foreground">With icons in the sidebar, a date range and a button, and a status of every tone</p>
      <DashboardHero
        className="pt-8 sm:pt-8 lg:pt-8"
        eyebrow="Billing for teams"
        title="Invoices that actually get paid."
        description="Halcyon turns every agreement into an invoice, chases the late ones for you and shows your cash flow without a spreadsheet."
        primary={{ label: "Start a free trial", href: "#trial" }}
        secondary={{ label: "See pricing", href: "#pricing" }}
        window={{
          title: "Northwind Studio / Billing",
          nav: [
            { label: "Overview", icon: <IconHome /> },
            { label: "Invoices", icon: <IconReceipt /> },
            { label: "Customers", icon: <IconUsers /> },
            { label: "Reports", icon: <IconChartBar /> },
            { label: "Settings", icon: <IconSettings /> },
          ],
          activeNav: "Invoices",
          heading: "Invoices",
          range: "Last 30 days",
          action: "New invoice",
          kpis: [
            { label: "Revenue", value: "$48.2k", change: "+12.4%" },
            { label: "Outstanding", value: "$9,870", change: "-3.1%" },
            { label: "Paid on time", value: "94%", change: "+2.0%" },
          ],
          rowsTitle: "Recent invoices",
          columns: ["Customer", "Status", "Amount"],
          rows: [
            { name: "Northwind Traders", detail: "INV-2041 / due 14 Nov", status: "Paid", tone: "success", amount: "$2,400.00" },
            { name: "Kestrel Labs", detail: "INV-2040 / due 18 Nov", status: "Pending", tone: "pending", amount: "$890.00" },
            { name: "Polder & Co", detail: "INV-2039 / due 12 Nov", status: "Paid", tone: "success", amount: "$1,250.00" },
            { name: "Lumen Studio", detail: "INV-2038 / due 28 Oct", status: "Overdue", tone: "error", amount: "$320.00" },
            { name: "Ardent Works", detail: "INV-2037 / due 10 Nov", status: "Paid", tone: "success", amount: "$4,100.00" },
            { name: "Fjord Freight", detail: "INV-2036 / due 9 Nov", status: "Draft", tone: "neutral", amount: "$760.00" },
          ],
        }}
      />
      <p className="border-t border-border pt-8 text-xs text-muted-foreground">The smallest call: a title, one action and plain labels for the sidebar, with the figures falling</p>
      <DashboardHero
        className="pt-8 sm:pt-8 lg:pt-8"
        title="Know which page loses the visit."
        primary={{ label: "Open the demo", href: "#demo" }}
        window={{
          title: "Kestrel Analytics",
          nav: ["Overview", "Funnels", "Retention", "Segments", "Exports"],
          activeNav: "Funnels",
          kpis: [
            { label: "Visitors", value: "128.4k", change: "+8.2%" },
            { label: "Sign-ups", value: "4,912", change: "+3.7%" },
            { label: "Bounce rate", value: "41%", change: "-1.9%", trend: "down" },
          ],
          rowsTitle: "Top pages",
          columns: ["Page", "Status", "Views"],
          rows: [
            { name: "Pricing", detail: "/pricing", status: "Live", tone: "success", amount: "18,402" },
            { name: "Getting started", detail: "/docs/start", status: "Live", tone: "success", amount: "12,951" },
            { name: "Changelog", detail: "/changelog", status: "Slow", tone: "pending", amount: "7,630" },
            { name: "Enterprise", detail: "/enterprise", status: "Broken", tone: "error", amount: "3,118" },
            { name: "Careers", detail: "/careers", status: "Draft", tone: "neutral", amount: "1,204" },
          ],
        }}
      />
    </div>
  );
}
