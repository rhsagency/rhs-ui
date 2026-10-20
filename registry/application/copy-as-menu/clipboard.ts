/*
 * Putting text on the clipboard from a click, including text that takes a
 * moment to produce. Kept apart from the component so the component file only
 * exports components.
 */

/** The old way, for pages where the Clipboard API is missing or blocked: a hidden field, selected, and the copy command. */
function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  Object.assign(area.style, { position: "fixed", top: "0", left: "0", width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
  document.body.append(area);
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  area.select();
  area.setSelectionRange(0, text.length); // iOS ignores select() alone
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  area.remove();
  active?.focus({ preventScroll: true });
  return copied;
}

async function writeText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    if (!legacyCopy(text)) throw error;
  }
}

/**
 * Copies text and returns what was copied. A string is written straight away,
 * inside the click. A promise (a table being turned into CSV) goes in as a
 * ClipboardItem, so Safari keeps the click's permission while it resolves;
 * where that is not supported it waits for the text first. Rejects when the
 * text could not be produced or the browser refused to copy it.
 */
export async function copyText(source: string | Promise<string>): Promise<string> {
  if (typeof source === "string") {
    await writeText(source);
    return source;
  }
  const clipboard = typeof navigator === "undefined" ? undefined : navigator.clipboard;
  if (clipboard && typeof ClipboardItem !== "undefined" && typeof clipboard.write === "function") {
    let text = "";
    try {
      const blob = source.then((value) => {
        text = value;
        return new Blob([value], { type: "text/plain" });
      });
      // The failure is handled by the write below; this keeps it from also being reported as unhandled.
      blob.catch(() => undefined);
      await clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      return text;
    } catch {
      // Fall through: wait for the text, then try the plain ways. A rejected source rejects again below.
    }
  }
  const text = await source;
  await writeText(text);
  return text;
}
