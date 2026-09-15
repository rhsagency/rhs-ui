// Typecheck shim only. In a consumer project `@/lib/utils` is the project's
// own `cn`; the shadcn CLI rewrites the import. Not part of the registry.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
