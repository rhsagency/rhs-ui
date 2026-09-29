"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";

export default function Demo(): React.JSX.Element {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slug = String(new FormData(event.currentTarget).get("slug") ?? "");
    const problem = !slug ? "Choose an address for the workspace." : /^[a-z0-9-]{3,}$/.test(slug) ? null : "Use at least three lower-case letters, digits or hyphens.";
    setError(problem);
    setSent(!problem);
  };
  return (
    <form onSubmit={submit} noValidate className="grid w-full max-w-sm gap-4">
      <FormField error={error} described>
        <FormLabel>Workspace address</FormLabel>
        <FormControl>
          <Input name="slug" defaultValue="North Wind" autoComplete="off" />
        </FormControl>
        <FormDescription>rhsui.com/w/your-address. You can change it later.</FormDescription>
      </FormField>
      <Button type="submit" className="justify-self-start">
        Create workspace
      </Button>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {sent ? "Created. Not really: this is a preview." : "Submit to see the error wiring."}
      </p>
    </form>
  );
}
