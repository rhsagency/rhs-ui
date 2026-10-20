import type { ReactNode } from "react";

import {
  IconArchive,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconClock,
  IconFileCode,
  IconTable,
  IconFileText,
  IconFolder,
  IconGitBranch,
  IconMoreHorizontal,
  IconStar,
} from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "@rhs-ui/primitives/button-group";
import { CopyButton } from "@rhs-ui/primitives/copy-button";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="mb-9 grid min-w-0 break-inside-avoid grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full max-w-3xl columns-[22rem] gap-x-12">
      <Example caption="Outline, with text and icon buttons">
        <ButtonGroup variant="outline" stackBelow="sm" aria-label="Message actions">
          <Button>
            <IconArchive />
            Archive
          </Button>
          <Button>
            <IconClock />
            Snooze
          </Button>
          <Button>
            <IconFolder />
            Move
          </Button>
          <Button size="icon" aria-label="More actions">
            <IconMoreHorizontal />
            {/* Stacked on a phone the square button is a full-width stripe, so it says what it is. */}
            <span className="hidden max-sm:inline">More</span>
          </Button>
        </ButtonGroup>
      </Example>

      <Example caption="Solid, with separators">
        <ButtonGroup variant="default" stackBelow="sm" aria-label="Review this change">
          <Button>Approve</Button>
          <ButtonGroupSeparator />
          <Button>Comment</Button>
          <ButtonGroupSeparator />
          <Button>Request changes</Button>
        </ButtonGroup>
      </Example>

      <Example caption="A text segment beside a button">
        <div className="flex flex-wrap items-center gap-3">
          <ButtonGroup variant="outline" aria-label="Star this repository">
            <Button>
              <IconStar />
              Star
            </Button>
            <ButtonGroupText>1,284</ButtonGroupText>
          </ButtonGroup>
          <ButtonGroup variant="outline" aria-label="Fork this repository">
            <Button>
              <IconGitBranch />
              Fork
            </Button>
            <ButtonGroupText>212</ButtonGroupText>
          </ButtonGroup>
        </div>
      </Example>

      <Example caption="A Copy button takes the group's size and look">
        <ButtonGroup variant="outline" aria-label="Install command">
          <ButtonGroupText className="font-mono text-[0.8125rem]">npm i @northwind/ui</ButtonGroupText>
          <CopyButton iconOnly value="npm i @northwind/ui" label="Copy command" />
        </ButtonGroup>
      </Example>

      <Example caption="Vertical">
        <ButtonGroup orientation="vertical" variant="outline" className="w-44" aria-label="Export this report">
          <Button className="justify-start">
            <IconFileText />
            Export as PDF
          </Button>
          <Button className="justify-start">
            <IconTable />
            Export as CSV
          </Button>
          <Button className="justify-start">
            <IconFileCode />
            Export as JSON
          </Button>
        </ButtonGroup>
      </Example>

      <Example caption="Disabled buttons keep the shape">
        <ButtonGroup variant="outline" size="sm" aria-label="Pagination">
          <Button size="icon" aria-label="First page" disabled>
            <IconChevronsLeft />
          </Button>
          <Button size="icon" aria-label="Previous page" disabled>
            <IconChevronLeft />
          </Button>
          <ButtonGroupText>Page 1 of 12</ButtonGroupText>
          <Button size="icon" aria-label="Next page">
            <IconChevronRight />
          </Button>
          <Button size="icon" aria-label="Last page">
            <IconChevronsRight />
          </Button>
        </ButtonGroup>
      </Example>

      <Example caption="Stacks into a column below 640px">
        <ButtonGroup variant="outline" size="sm" stackBelow="sm" aria-label="Project actions">
          <Button>Duplicate</Button>
          <Button>Rename</Button>
          <Button>Share</Button>
          <Button>Delete</Button>
        </ButtonGroup>
      </Example>

      <Example caption="Not attached: each keeps its own variant">
        <ButtonGroup attached={false} aria-label="Draft actions">
          <Button variant="outline">Discard</Button>
          <Button variant="secondary">Save draft</Button>
          <Button>Publish</Button>
        </ButtonGroup>
      </Example>
    </div>
  );
}
