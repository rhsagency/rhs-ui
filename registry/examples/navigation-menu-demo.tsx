"use client";

import { IconBook, IconChart, IconLayers, IconRocket, IconSparkle, IconUsers } from "@rhs-ui/icons";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@rhs-ui/primitives/navigation-menu";

const PRODUCT = [
  { title: "Analytics", body: "See what moves, as it moves.", Icon: IconChart },
  { title: "Automations", body: "Hand the routine to the system.", Icon: IconSparkle },
  { title: "Integrations", body: "Connect the tools you already use.", Icon: IconLayers },
] as const;

const RESOURCES = [
  { title: "Guides", body: "From first setup to scale.", Icon: IconBook },
  { title: "Customer stories", body: "How teams ship with us.", Icon: IconUsers },
  { title: "Changelog", body: "Everything new, every week.", Icon: IconRocket },
] as const;

function Panel({ items }: { items: readonly { title: string; body: string; Icon: typeof IconChart }[] }) {
  return (
    <ul className="grid w-[min(20rem,calc(100vw-3rem))] gap-1 md:w-[28rem] md:grid-cols-2">
      {items.map(({ title, body, Icon }) => (
        <li key={title}>
          <NavigationMenuLink href="#" className="flex-row items-start gap-3">
            <Icon size={18} className="mt-0.5 shrink-0" />
            <span className="grid gap-1">
              <span className="font-medium text-foreground">{title}</span>
              <span className="text-xs leading-snug text-muted-foreground">{body}</span>
            </span>
          </NavigationMenuLink>
        </li>
      ))}
    </ul>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex min-h-80 w-full justify-center pt-4">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Product</NavigationMenuTrigger>
            <NavigationMenuContent>
              <Panel items={PRODUCT} />
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
            <NavigationMenuContent>
              <Panel items={RESOURCES} />
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink href="#" className={navigationMenuTriggerStyle}>
              Pricing
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
