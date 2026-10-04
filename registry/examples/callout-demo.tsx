import { Callout } from "@rhs-ui/primitives/callout";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-2xl gap-3 p-8">
      <Callout>Install the theme first; every component reads its tokens.</Callout>
      <Callout tone="tip" title="Keyboard">Press <code>⌘K</code> anywhere to search the docs.</Callout>
      <Callout tone="warning">Rotating a key signs out every running integration.</Callout>
      <Callout tone="danger" title="This cannot be undone">Deleting a workspace removes all projects and files.</Callout>
    </div>
  );
}
