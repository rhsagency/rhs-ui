/** One category of the shop or help centre. */
export interface CategoryNode {
  /** Identity of the category: `currentId` and the keys use it, so it is never the href. */
  id: string;
  /** The name of the category, as the link reads it. */
  label: string;
  /** Where the link goes. */
  href: string;
  /** How many products (or articles) are in it, children included. A count of 0 dims the link; it is never removed. */
  count?: number;
  /** The categories under it, each with their own children. Only the branch you are in is drawn. */
  children?: readonly CategoryNode[];
}

/** The categories from the top of the tree down to the one with this id, the last being that one. Null when no category has the id. */
export function pathTo(tree: readonly CategoryNode[], id: string): CategoryNode[] | null {
  for (const node of tree) {
    if (node.id === id) return [node];
    const below = node.children ? pathTo(node.children, id) : null;
    if (below) return [node, ...below];
  }
  return null;
}
