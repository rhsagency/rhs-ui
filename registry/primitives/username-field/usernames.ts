/** Names most products keep for themselves. A starting point for the `reserved` prop of UsernameField, not a promise that it is enough. */
export const RESERVED_USERNAMES: readonly string[] = ["admin", "administrator", "root", "support", "help", "security", "staff", "team", "api", "www", "mail", "settings", "billing", "null", "undefined"];

export type UsernameProblem = "start" | "reserved" | "short" | null;

/**
 * Lower case, accents folded (josé becomes jose), a typed @ dropped, and only
 * letters, digits, dots and underscores kept, cut at `max`. Also says where the
 * caret belongs afterwards: after the same characters as before, so a dropped
 * key does not throw it to the end of the field.
 */
export function cleanUsername(raw: string, caret: number, max: number): { value: string; caret: number } {
  const lead = raw.startsWith("@") ? 1 : 0;
  let value = "";
  let next = -1;
  for (let index = 0; index < raw.length; index += 1) {
    if (index === caret) next = value.length;
    if (index < lead) continue;
    for (const char of raw.charAt(index).normalize("NFD").toLowerCase()) {
      if (/[a-z0-9._]/.test(char) && value.length < max) value += char;
    }
  }
  return { value, caret: next === -1 ? value.length : next };
}

/** The first rule a name breaks that more typing cannot fix, or that is complete enough to judge: where it starts, whether it is reserved, whether it is too short. */
export function usernameProblem(username: string, min: number, reserved: readonly string[] = []): UsernameProblem {
  if (!username) return null;
  if (!/^[a-z]/.test(username)) return "start";
  if (reserved.some((name) => name.toLowerCase() === username)) return "reserved";
  if (username.length < min) return "short";
  return null;
}

export interface UsernameRule {
  id: "length" | "start" | "characters";
  label: string;
  met: boolean;
}

/** The rules as a list with what each one says right now, for the checklist under the field. */
export function usernameRules(username: string, min: number, max: number): UsernameRule[] {
  return [
    { id: "length", label: `${min} to ${max} characters`, met: username.length >= min && username.length <= max },
    { id: "start", label: "Starts with a letter", met: /^[a-z]/.test(username) },
    { id: "characters", label: "Letters, numbers, dots and underscores", met: username.length > 0 },
  ];
}
