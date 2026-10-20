"use client";

import { useRef, type ReactNode } from "react";

import { IconSave, IconSend } from "@rhs-ui/icons";
import { AsyncButton, type AsyncButtonStatus } from "@rhs-ui/primitives/async-button";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const SAVE = { idle: "Save changes", pending: "Saving…", success: "Changes saved", error: "Could not save" };

const STATES: { status: AsyncButtonStatus; caption: string }[] = [
  { status: "idle", caption: "Idle" },
  { status: "pending", caption: "Pending" },
  { status: "success", caption: "Success" },
  { status: "error", caption: "Error" },
];

function Example({ caption, children, wide = false }: { caption: string; children: ReactNode; wide?: boolean }): React.JSX.Element {
  return (
    <div className={wide ? "col-span-full grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3" : "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3"}>
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const attempts = useRef(0);
  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr))]">
      <Example caption="Press it: pending, then saved">
        <AsyncButton icon={<IconSave />} labels={SAVE} onClick={() => wait(1400)} />
      </Example>

      <Example caption="Fails the first time, and can be retried at once">
        <AsyncButton
          variant="outline"
          icon={<IconSend />}
          labels={{ idle: "Send invoice", pending: "Sending…", success: "Invoice sent", error: "Could not send" }}
          onClick={async () => {
            attempts.current += 1;
            await wait(1200);
            if (attempts.current % 2 === 1) throw new Error("The mail server did not answer.");
          }}
        />
      </Example>

      <Example caption="Any variant">
        <AsyncButton variant="secondary" labels={{ idle: "Publish post", pending: "Publishing…", success: "Published", error: "Failed to publish" }} onClick={() => wait(1600)} />
      </Example>

      <Example wide caption="Every state, driven from outside with status={mutation.status}">
        <div className="flex flex-wrap gap-x-8 gap-y-5">
          {STATES.map(({ status, caption }) => (
            <div key={status} className="grid min-w-0 justify-items-start gap-2">
              <AsyncButton status={status} icon={<IconSave />} labels={SAVE} />
              <span className="text-xs text-muted-foreground">{caption}</span>
            </div>
          ))}
        </div>
      </Example>
    </div>
  );
}
