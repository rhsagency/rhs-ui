import { Badge } from "@rhs-ui/primitives/badge";
import { DataList } from "@rhs-ui/primitives/data-list";

const initials = (name: string) => <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-xs font-medium">{name.split(" ").map((p) => p[0]).join("")}</span>;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-md p-8">
      <DataList
        label="Recent orders"
        items={[
          { id: "1", media: initials("Mei Tanaka"), title: "Mei Tanaka", subtitle: "LD-20418 · 2 items · today, 10:42", meta: <span className="tabular-nums">€87.00</span>, href: "#order-20418" },
          { id: "2", media: initials("Daan Peters"), title: "Daan Peters", subtitle: "LD-20417 · 1 item · today, 09:15", meta: <Badge variant="warning">Unpaid</Badge>, href: "#order-20417" },
          { id: "3", media: initials("Sara Haddad"), title: "Sara Haddad", subtitle: "LD-20416 · 4 items · yesterday", meta: <span className="tabular-nums">€212.50</span>, href: "#order-20416" },
        ]}
      />
    </div>
  );
}
