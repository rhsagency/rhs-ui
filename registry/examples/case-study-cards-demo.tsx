import { IconCube, IconHexagon, IconTriangle } from "@rhs-ui/icons";
import { CaseStudyCards } from "@rhs-ui/marketing/case-study-cards";

const art = (fill: string, shape: string) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'><rect width='800' height='500' fill='${fill}'/>${shape}</svg>`);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <CaseStudyCards
        title="Teams that moved faster."
        description="Three stories, told with the numbers they shared with us."
        studies={[
          { href: "#fieldwork", company: "Fieldwork", logo: <IconHexagon />, metric: "6 h", metricLabel: "saved per designer, per week", summary: "A 40-person studio replaced three tools and their Monday status call.", image: <img src={art("#d6d1c7", "<circle cx='400' cy='250' r='120' fill='#8c867b'/>")} alt="" /> },
          { href: "#northwind", company: "Northwind", logo: <IconTriangle />, metric: "3x", metricLabel: "more releases per quarter", summary: "Shipping weekly instead of monthly, with the changelog written from the work.", image: <img src={art("#2f3236", "<rect x='280' y='150' width='240' height='200' rx='24' fill='#70757c'/>")} alt="" /> },
          { href: "#atlas", company: "Atlas Logistics", logo: <IconCube />, metric: "−40%", metricLabel: "time to onboard a new hire", summary: "Every process in one place meant new planners were productive in week one.", image: <img src={art("#e5e2dc", "<path d='M250 380 L400 120 L550 380 Z' fill='#a39c90'/>")} alt="" /> },
        ]}
      />
    </div>
  );
}
