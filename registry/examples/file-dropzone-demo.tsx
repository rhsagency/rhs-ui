import { FileDropzone } from "@rhs-ui/primitives/file-dropzone";

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full max-w-md">
      <FileDropzone label="Upload your brand assets" accept=".pdf,.svg,image/*" maxSize={10 * 1024 * 1024} maxFiles={5} hint="PDF, SVG or image, up to 10 MB each" />
    </div>
  );
}
