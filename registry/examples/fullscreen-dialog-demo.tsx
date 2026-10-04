"use client";

import { useState } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { FullscreenDialog } from "@rhs-ui/primitives/fullscreen-dialog";
import { Input } from "@rhs-ui/primitives/input";
import { Textarea } from "@rhs-ui/primitives/textarea";

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <div className="mx-auto flex min-h-64 max-w-sm items-center justify-center p-8">
      <FullscreenDialog
        open={open}
        onOpenChange={setOpen}
        trigger={<Button>Write a post</Button>}
        title="New post"
        description="Draft, saved on this device"
        action={<Button size="sm" onClick={() => setOpen(false)}>Publish</Button>}
      >
        <div className="mx-auto grid max-w-2xl gap-4 p-6">
          <label htmlFor="fs-title" className="text-sm font-medium">Title</label>
          <Input id="fs-title" defaultValue="What happened when we closed on Fridays" />
          <label htmlFor="fs-body" className="text-sm font-medium">Body</label>
          <Textarea id="fs-body" rows={14} defaultValue="Six months ago we tried a four-day week..." />
        </div>
      </FullscreenDialog>
    </div>
  );
}
