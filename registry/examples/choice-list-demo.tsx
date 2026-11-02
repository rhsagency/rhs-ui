"use client";

import { useState, type ReactNode } from "react";

import { IconClock, IconGift, IconHeadphones, IconShield, IconStore, IconTruck, IconWrench, IconZap } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { ChoiceList, type ChoiceOption } from "@rhs-ui/primitives/choice-list";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Heading({ id, title, hint }: { id: string; title: string; hint: string }): React.JSX.Element {
  return (
    <div className="grid gap-1">
      <h2 id={id} className="text-sm font-medium tracking-[-0.01em]">
        {title}
      </h2>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

const DELIVERY: readonly ChoiceOption[] = [
  { value: "standard", label: "Standard", description: "3 to 5 working days", trailing: "Free", media: <IconTruck /> },
  { value: "express", label: "Express", description: "Tomorrow, before noon", trailing: "12.00", media: <IconZap /> },
  { value: "same-day", label: "Same day", description: "Not on Sundays: order again on Monday.", trailing: "24.00", media: <IconClock />, disabled: true },
  { value: "pickup", label: "Pick up in store", description: "Northwind Amsterdam, ready in 2 hours", trailing: "Free", media: <IconStore /> },
];

const EXTRAS: readonly ChoiceOption[] = [
  { value: "gift", label: "Gift wrap", description: "Recycled paper and a handwritten card", trailing: "4.00", media: <IconGift /> },
  { value: "warranty", label: "Extended warranty", description: "Two more years of repairs and replacements", trailing: "29.00", media: <IconShield /> },
  { value: "setup", label: "Express setup", description: "A technician connects everything at home", trailing: "49.00", media: <IconWrench /> },
  { value: "support", label: "Priority support", description: "A reply from a person within the hour", trailing: "9.00", media: <IconHeadphones /> },
  { value: "none", label: "None of these", exclusive: true },
];

const person = (name: string, role: string, files: string, extra?: Partial<ChoiceOption>): ChoiceOption => ({
  value: name.toLowerCase().replace(/\s+/g, "-"),
  label: name,
  description: role,
  trailing: files,
  media: (
    <Avatar size="default" className="size-9">
      <AvatarFallback>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  ),
  ...extra,
});

const PEOPLE: readonly ChoiceOption[] = [
  person("Ada Okafor", "Design lead", "12 files"),
  person("Marcus Lindqvist", "Engineering", "8 files"),
  person("Priya Nair", "Finance: no access to this folder", "0 files", { disabled: true }),
];

/** The price of what is chosen, from the same "4.00" strings the rows show. */
const total = (chosen: readonly string[]): string => EXTRAS.filter((option) => chosen.includes(option.value)).reduce((sum, option) => sum + Number(option.trailing ?? 0), 0).toFixed(2);

const show = (value: unknown): string => JSON.stringify(value).replace(/,/g, ", ");

export default function Demo(): React.JSX.Element {
  const [delivery, setDelivery] = useState("express");
  const [extras, setExtras] = useState<string[]>(["gift", "warranty"]);
  const [people, setPeople] = useState<string[]>(["ada-okafor"]);
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: one choice, the arrow keys move and choose, and a row that is off says why">
        <div className="grid gap-4">
          <Heading id="delivery-title" title="How should we send it?" hint="Prices are for the Northwind order in your basket." />
          <ChoiceList aria-labelledby="delivery-title" name="delivery" options={DELIVERY} value={delivery} onValueChange={setDelivery} />
          <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground">{show(delivery)}</code>
          </p>
        </div>
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Several choices: Space toggles, and None of these clears the others">
          <div className="grid gap-4">
            <Heading id="extras-title" title="Add to your order" hint={extras.length === 0 ? "Pick any that apply." : extras.includes("none") ? "No extras." : `${extras.length} chosen, ${total(extras)} EUR.`} />
            <ChoiceList aria-labelledby="extras-title" mode="multiple" name="extras" options={EXTRAS} value={extras} onValueChange={setExtras} />
          </div>
        </Example>
        <Example caption="With avatars and a count on every row">
          <div className="grid gap-4">
            <Heading id="people-title" title="Share the Q3 folder" hint="People with access can view and comment." />
            <ChoiceList aria-labelledby="people-title" mode="multiple" name="people" options={PEOPLE} value={people} onValueChange={setPeople} />
          </div>
        </Example>
      </div>
    </div>
  );
}
