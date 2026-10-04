import { BarList } from "@rhs-ui/dashboard/bar-list";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-md p-8">
      <p className="mb-3 text-sm font-medium">Top pages, last 7 days</p>
      <BarList
        labels={["Page", "Visitors"]}
        items={[
          { name: "/pricing", value: 8420, href: "#pricing" },
          { name: "/", value: 12980, href: "#home" },
          { name: "/blog/four-day-week", value: 5630, href: "#post" },
          { name: "/docs/install", value: 3210, href: "#docs" },
          { name: "/changelog", value: 1480, href: "#changelog" },
        ]}
      />
    </div>
  );
}
