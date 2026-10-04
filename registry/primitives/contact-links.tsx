import { IconMail, IconPin, IconMessageCircle, IconPhone } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ContactLinksProps {
  /** As people dial it: "+31 6 1234 5678". */
  phone?: string;
  email?: string;
  /** International digits only for wa.me: "31612345678". */
  whatsapp?: string;
  address?: string;
  /** A maps link for the address. */
  mapsHref?: string;
  /** Stack the lines (footer) or set them in a row (header strip). */
  orientation?: "vertical" | "horizontal";
  className?: string;
}

/**
 * The ways to reach a small business, each one tappable: the phone dials,
 * the email opens mail, WhatsApp opens a chat, the address opens maps.
 * Icons on the left, the value in text, so it scans and it copies.
 */
export function ContactLinks({ phone, email, whatsapp, address, mapsHref, orientation = "vertical", className }: ContactLinksProps) {
  const rows = [
    phone ? { key: "phone", icon: IconPhone, label: phone, href: `tel:${phone.replace(/[^\d+]/g, "")}` } : null,
    email ? { key: "email", icon: IconMail, label: email, href: `mailto:${email}` } : null,
    whatsapp ? { key: "whatsapp", icon: IconMessageCircle, label: "WhatsApp", href: `https://wa.me/${whatsapp}` } : null,
    address ? { key: "address", icon: IconPin, label: address, href: mapsHref } : null,
  ].filter((row) => row !== null);
  return (
    <ul data-slot="contact-links" className={cn("text-sm", orientation === "vertical" ? "grid gap-3" : "flex flex-wrap gap-x-6 gap-y-2", className)}>
      {rows.map(({ key, icon: Icon, label, href }) => (
        <li key={key} className="flex min-w-0 items-start gap-2.5">
          <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          {href ? (
            <a href={href} className="min-w-0 rounded-sm break-words underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40" {...(key === "whatsapp" || key === "address" ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{label}</a>
          ) : (
            <span className="min-w-0 break-words">{label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
