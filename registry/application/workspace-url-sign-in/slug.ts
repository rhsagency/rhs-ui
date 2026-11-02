/** The longest a hostname label can be, and so the longest workspace address. */
export const MAX_WORKSPACE_SLUG = 63;

/**
 * A workspace address as it is typed or pasted: lower case, no spaces, and
 * only what a hostname label can hold (letters, digits and hyphens, never a
 * hyphen first). A whole address works as well, so pasting
 * "https://Acme.example.com/login" gives "acme", and typing the dot that
 * starts the domain after the name just drops it. A hyphen at the end is
 * kept, since the next letter is on its way; `trimWorkspaceSlug` takes it off
 * once the person is done.
 */
export function cleanWorkspaceSlug(raw: string, maxLength = MAX_WORKSPACE_SLUG): string {
  const label = raw
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .split(/[./:?#@]/)[0];
  return (label ?? "").replace(/[^a-z0-9-]/g, "").replace(/^-+/, "").slice(0, maxLength);
}

/** The address as it is sent: without the hyphen a person may have left at the end. */
export function trimWorkspaceSlug(slug: string): string {
  return slug.replace(/-+$/, "");
}

/** The domain as it is written after the field: "example.com", with no dot in front and no address around it. */
export function cleanWorkspaceDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, "")
    .replace(/[/?#].*$/, "")
    .replace(/^\.+/, "");
}
