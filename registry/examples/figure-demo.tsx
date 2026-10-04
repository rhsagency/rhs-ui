import { Figure } from "@rhs-ui/primitives/figure";

const photo = "data:image/svg+xml;utf8," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 450'><rect width='800' height='450' fill='#c9cfc4'/><path d='M0 330 220 200 400 290 600 150 800 300V450H0z' fill='#7f8c78'/><circle cx='640' cy='100' r='44' fill='#f1ecd8'/></svg>");

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <Figure ratio="16/9" caption="The ridge above the valley, an hour before sunset." credit="Photo: Jip de Graaf">
        <img src={photo} alt="Green hills under a low sun" />
      </Figure>
    </div>
  );
}
