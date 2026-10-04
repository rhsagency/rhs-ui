import { LogoCloud } from "@rhs-ui/marketing/logo-cloud";

const mark = (d: string) => (
  <svg viewBox="0 0 96 28" fill="currentColor" role="img">
    <path d={d} />
  </svg>
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <LogoCloud
        title="Trusted by product teams at"
        logos={[
          { name: "Northwind", mark: mark("M4 6h6l8 12V6h6v16h-6L10 10v12H4z M30 6h20v4H36v3h12v4H36v5h-6z") },
          { name: "Halcyon" },
          { name: "Fieldwork", mark: mark("M14 2a12 12 0 1 1 0 24a12 12 0 0 1 0-24zm0 6a6 6 0 1 0 0 12a6 6 0 0 0 0-12z M34 8h6v12h12v4H34z") },
          { name: "Atlas & Co" },
          { name: "Meridian", mark: mark("M2 22L14 4l12 18h-6l-6-9l-6 9z M32 10h28v4H32zm0 8h20v4H32z") },
          { name: "Quanta" },
        ]}
      />
    </div>
  );
}
