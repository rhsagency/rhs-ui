"use client";

import { useId, useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export interface CookieCategory {
  id: string;
  label: string;
  description: string;
  /** Necessary cookies cannot be switched off. */
  required?: boolean;
}

export interface CookieBannerProps {
  categories: readonly CookieCategory[];
  /** Called with the ids that were accepted; store the choice yourself. */
  onDecide: (accepted: string[]) => void;
  policyHref: string;
  /** Pin to the bottom of the viewport (default) or render in flow. */
  position?: "fixed" | "inline";
  className?: string;
}

/**
 * Consent that is as easy to refuse as to give: accept all and reject all
 * are equal buttons, and the details let people choose per category. No
 * box is pre-ticked, which is what the GDPR asks for.
 */
export function CookieBanner({ categories, onDecide, policyHref, position = "fixed", className }: CookieBannerProps) {
  const id = useId();
  const [details, setDetails] = useState(false);
  const [chosen, setChosen] = useState<Record<string, boolean>>({});
  const required = categories.filter((category) => category.required).map((category) => category.id);
  return (
    <div
      data-slot="cookie-banner"
      role="dialog"
      aria-labelledby={`${id}-title`}
      className={cn("z-50 w-full max-w-xl rounded-2xl border border-border bg-background p-6 shadow-lg", position === "fixed" && "fixed right-4 bottom-4 left-4 mx-auto sm:left-auto", className)}
    >
      <h2 id={`${id}-title`} className="text-base font-medium">Cookies on this site</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        We use necessary cookies to make the site work, and others only if you allow them. <a href={policyHref} className="text-foreground underline underline-offset-4">Cookie policy</a>
      </p>
      {details ? (
        <ul className="mt-5 divide-y divide-border border-y border-border">
          {categories.map((category) => (
            <li key={category.id} className="flex items-start justify-between gap-6 py-4">
              <label htmlFor={`${id}-${category.id}`} className="text-sm">
                <span className="block font-medium">{category.label}</span>
                <span className="mt-0.5 block text-muted-foreground">{category.description}</span>
              </label>
              <Switch
                id={`${id}-${category.id}`}
                checked={category.required ? true : Boolean(chosen[category.id])}
                disabled={category.required}
                onCheckedChange={(value) => setChosen((current) => ({ ...current, [category.id]: value }))}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => onDecide(required)}>Reject all</Button>
        <Button onClick={() => onDecide(categories.map((category) => category.id))}>Accept all</Button>
        {details ? (
          <Button variant="ghost" onClick={() => onDecide([...required, ...Object.keys(chosen).filter((key) => chosen[key])])}>Save choices</Button>
        ) : (
          <Button variant="ghost" onClick={() => setDetails(true)}>Choose</Button>
        )}
      </div>
    </div>
  );
}
