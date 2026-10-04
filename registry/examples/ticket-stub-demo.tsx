import { IconQrCode } from "@rhs-ui/icons";
import { TicketStub } from "@rhs-ui/primitives/ticket-stub";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto flex max-w-2xl justify-center p-8">
      <TicketStub
        event="Calm Software Summit 2026"
        holder="Anouk de Wit"
        details={[{ label: "Date", value: "12 June" }, { label: "Doors", value: "08:30" }, { label: "Seat", value: "Hall B, 14" }]}
        code="CSS26-8K2M-4QX"
        scan={<IconQrCode />}
      />
    </div>
  );
}
