import { IconDownload } from "@rhs-ui/icons";
import { FileCard } from "@rhs-ui/primitives/file-card";

const thumb = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='#d8d3c9'/><circle cx='200' cy='150' r='70' fill='#8d877c'/></svg>");
const download = <a href="#download" aria-label="Download" className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><IconDownload className="size-4" /></a>;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-3xl gap-4 p-8 sm:grid-cols-3">
      <FileCard name="Studio photo, final selection, April.jpg" size={2_400_000} modified="14 Apr 2026" thumbnail={thumb} href="#photo" actions={download} />
      <FileCard name="Q1 report.pdf" size={840_000} modified="2 Apr 2026" href="#report" actions={download} />
      <FileCard name="customers-export-2026-04.csv" size={128_000} modified="Today" href="#csv" actions={download} />
    </div>
  );
}
