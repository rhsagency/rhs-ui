"use client";

import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";

import { FormTabs, type FormTab } from "@rhs-ui/application/form-tabs";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Textarea } from "@rhs-ui/primitives/textarea";

/** Which tab each field lives in, so the problems the server reports can be counted per tab. */
const TAB_OF: Record<string, string> = { title: "general", price: "pricing", compare_at: "pricing", handle: "seo", page_title: "seo" };

/** What the server said the last time, as it would after a save that was refused. */
const FROM_SERVER: Record<string, string> = {
  price: "Enter a price. Free products are set up under Gifts.",
  handle: "Use lowercase letters, numbers and single dashes, like halcyon-stoneware-mug.",
  page_title: "Add a page title, up to 60 characters.",
};

function Optional(): React.JSX.Element {
  return <span className="font-normal text-muted-foreground">Optional</span>;
}

function Fields({ children }: { children: ReactNode }): React.JSX.Element {
  return <div className="grid gap-5">{children}</div>;
}

export default function Demo(): React.JSX.Element {
  const [errors, setErrors] = useState<Record<string, string>>(FROM_SERVER);
  const [tab, setTab] = useState("pricing");
  const [saved, setSaved] = useState(false);

  const counts: Record<string, number> = {};
  for (const name of Object.keys(errors)) counts[TAB_OF[name] ?? "general"] = (counts[TAB_OF[name] ?? "general"] ?? 0) + 1;

  /** A problem the server reported goes as soon as the field holds something the browser accepts. */
  function fixed(name: string) {
    return (event: ChangeEvent<HTMLInputElement>): void => {
      if (!event.currentTarget.validity.valid) return;
      setErrors(({ [name]: _gone, ...rest }) => rest);
    };
  }

  const problems = Object.keys(errors).length;
  const status = saved
    ? "Saved just now. All three tabs went in one request."
    : problems > 0
      ? `Not saved. The server found ${problems} ${problems === 1 ? "problem" : "problems"}.`
      : "Nothing left to fix. Press Save changes to send all three tabs.";

  function save(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    // Only a submit the browser accepted gets here. Every tab went with it.
    setErrors({});
    setSaved(true);
  }

  const tabs: FormTab[] = [
    {
      id: "general",
      label: "General",
      content: (
        <Fields>
          <FormField error={errors.title}>
            <FormLabel>Product name</FormLabel>
            <FormControl>
              <Input name="title" defaultValue="Halcyon stoneware mug" required autoComplete="off" onChange={fixed("title")} />
            </FormControl>
          </FormField>
          <FormField described>
            <FormLabel>SKU</FormLabel>
            <FormControl>
              <Input name="sku" defaultValue="HAL-0041" required autoComplete="off" className="sm:max-w-xs" />
            </FormControl>
            <FormDescription>Letters, numbers and dashes. Your customers never see it.</FormDescription>
          </FormField>
          <FormField>
            <FormLabel>
              Description <Optional />
            </FormLabel>
            <FormControl>
              <Textarea name="description" rows={4} defaultValue="Wheel-thrown in small batches and glazed by hand. Holds 300 ml and goes in the dishwasher." />
            </FormControl>
          </FormField>
        </Fields>
      ),
    },
    {
      id: "pricing",
      label: "Pricing",
      content: (
        <Fields>
          <div className="grid items-start gap-5 sm:grid-cols-2">
            <FormField error={errors.price} described>
              <FormLabel>Price in euros</FormLabel>
              <FormControl>
                <Input name="price" type="number" inputMode="decimal" min="0.01" step="0.01" required placeholder="0.00" onChange={fixed("price")} className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
              </FormControl>
              <FormDescription>What the customer pays, VAT included.</FormDescription>
            </FormField>
            <FormField described>
              <FormLabel>
                Compare-at price <Optional />
              </FormLabel>
              <FormControl>
                <Input name="compare_at" type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
              </FormControl>
              <FormDescription>Shown crossed out next to the price.</FormDescription>
            </FormField>
          </div>
        </Fields>
      ),
    },
    {
      id: "seo",
      label: "SEO",
      content: (
        <Fields>
          <FormField error={errors.handle} described>
            <FormLabel>URL handle</FormLabel>
            <FormControl>
              <Input
                name="handle"
                defaultValue="Halcyon Stoneware Mug"
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                title="Lowercase letters, numbers and single dashes"
                autoComplete="off"
                autoCapitalize="none"
                onChange={fixed("handle")}
              />
            </FormControl>
            <FormDescription>halcyon.example/products/halcyon-stoneware-mug</FormDescription>
          </FormField>
          <FormField error={errors.page_title} described>
            <FormLabel>Page title</FormLabel>
            <FormControl>
              <Input name="page_title" required maxLength={60} placeholder="Halcyon stoneware mug | Halcyon" autoComplete="off" onChange={fixed("page_title")} />
            </FormControl>
            <FormDescription>Up to 60 characters. It is what a search result shows.</FormDescription>
          </FormField>
          <FormField>
            <FormLabel>
              Meta description <Optional />
            </FormLabel>
            <FormControl>
              <Textarea name="meta_description" rows={3} />
            </FormControl>
          </FormField>
        </Fields>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header className="mb-6 grid gap-1">
        <h2 className="text-2xl font-semibold tracking-[-0.03em]">Halcyon stoneware mug</h2>
        <p className="text-sm text-muted-foreground">One product, three tabs, one form. Fix a problem and its count drops; empty a required field and press Save, and the tab that holds it opens.</p>
      </header>

      <form onSubmit={save} onInput={() => setSaved(false)} className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        <div className="p-5 sm:p-6">
          <FormTabs tabs={tabs} value={tab} onValueChange={setTab} errorCounts={counts} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border bg-muted/30 px-5 py-3.5 sm:px-6">
          <p role="status" className="min-w-0 flex-1 basis-56 text-sm text-muted-foreground">
            {status}
          </p>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
