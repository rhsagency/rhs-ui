"use client";

import { PortfolioGrid } from "@rhs-ui/marketing/portfolio-grid";

const art = (fill: string, shape: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'><rect width='800' height='600' fill='${fill}'/>${shape}</svg>`);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <PortfolioGrid
        title="Selected work"
        projects={[
          { href: "#nw", title: "A calmer checkout", client: "Northwind", category: "Website", year: "2026", wide: true, image: <img src={art("#2f3236", "<rect x='250' y='150' width='300' height='300' rx='30' fill='#6f747b'/>")} alt="" /> },
          { href: "#fw", title: "Identity for a studio", client: "Fieldwork", category: "Branding", year: "2026", image: <img src={art("#d8d3c9", "<circle cx='400' cy='300' r='150' fill='#8d877c'/>")} alt="" /> },
          { href: "#at", title: "Route planner", client: "Atlas Logistics", category: "Product", year: "2025", image: <img src={art("#e6e3dd", "<path d='M250 450 L400 150 L550 450Z' fill='#a39c90'/>")} alt="" /> },
          { href: "#hh", title: "Patient portal", client: "Halcyon Health", category: "Product", year: "2025", image: <img src={art("#bdb6aa", "<path d='M100 400 Q400 150 700 400' stroke='#3a3c40' stroke-width='24' fill='none'/>")} alt="" /> },
          { href: "#me", title: "Annual report", client: "Meridian", category: "Branding", year: "2024", image: <img src={art("#9aa0a6", "<circle cx='300' cy='300' r='90' fill='#e5e2dc'/><circle cx='500' cy='300' r='90' fill='#3c4046'/>")} alt="" /> },
        ]}
      />
    </div>
  );
}
