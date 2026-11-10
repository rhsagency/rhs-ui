import { CustomerPhotoGrid } from "@rhs-ui/marketing/customer-photo-grid";

/** Pictures drawn for the demo, square. In your page: the photographs your customers shared. */
const photo = (body: string): string => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'>${body}</svg>`);

const PLANT = photo(
  `<rect width='400' height='400' fill='#e6dfd3'/><rect y='306' width='400' height='20' fill='#c8a67e'/><rect y='326' width='400' height='16' fill='#d6cdbd'/>` +
    [-30, -14, 0, 14, 30].map((angle, i) => `<ellipse cx='200' cy='${i % 2 ? 128 : 114}' rx='17' ry='${i % 2 ? 80 : 94}' fill='${i % 2 ? "#8a9a7b" : "#6f8265"}' transform='rotate(${angle} 200 226)'/>`).join("") +
    `<path d='M160 236h80l-10 70h-60z' fill='#c4714b'/><rect x='152' y='224' width='96' height='18' rx='5' fill='#d27f58'/><ellipse cx='200' cy='312' rx='64' ry='6' fill='#000' opacity='.12'/>`,
);

const SOFA = photo(
  `<rect width='400' height='400' fill='#dcd5c8'/><rect y='338' width='400' height='62' fill='#c8b89c'/><rect x='26' y='170' width='348' height='132' rx='28' fill='#6e7a74'/><rect x='26' y='252' width='348' height='84' rx='20' fill='#7d8983'/>` +
    `<rect x='60' y='186' width='116' height='104' rx='16' fill='#efe8da' transform='rotate(-6 118 238)'/><path d='M76 214l78-8M74 238l82-8M72 262l84-8' stroke='#cfc4ae' stroke-width='5' transform='rotate(-6 118 238)'/>` +
    `<rect x='196' y='198' width='100' height='92' rx='16' fill='#c9ad8f' transform='rotate(7 246 244)'/><path d='M300 250c24 4 48 12 64 40v46h-58z' fill='#a9715b'/><rect x='46' y='336' width='10' height='16' fill='#3f3b33'/><rect x='344' y='336' width='10' height='16' fill='#3f3b33'/>`,
);

const MUGS = photo(
  `<rect width='400' height='400' fill='#cdb08a'/><path d='M0 80H400M0 160H400M0 240H400M0 320H400' stroke='#bf9f78' stroke-width='3'/><rect x='46' y='96' width='308' height='214' rx='28' fill='#f0ebe2'/><rect x='58' y='108' width='284' height='190' rx='20' fill='#e4ddcf'/>` +
    `<rect x='188' y='184' width='46' height='28' rx='13' fill='#e8e3da' stroke='#cfc8bb' stroke-width='4'/><circle cx='148' cy='202' r='56' fill='#e8e3da' stroke='#cfc8bb' stroke-width='4'/><circle cx='148' cy='202' r='43' fill='#4a3b32'/><path d='M126 190a26 26 0 0 1 44 0' stroke='#6a5546' stroke-width='5' fill='none' stroke-linecap='round'/>` +
    `<circle cx='272' cy='214' r='38' fill='#f6f2ea' stroke='#d9d2c4' stroke-width='3'/><ellipse cx='272' cy='214' rx='20' ry='14' fill='#c79a62' transform='rotate(-20 272 214)'/>`,
);

const LAMP = photo(
  `<rect width='400' height='400' fill='#d9d1c3'/><path d='M200 0V118' stroke='#2f2f2d' stroke-width='3'/><path d='M140 190a60 60 0 0 1 120 0z' fill='#2f2f2d'/><ellipse cx='200' cy='190' rx='60' ry='9' fill='#f1dfb0'/><path d='M146 198L70 306H330L254 198z' fill='#f6e9c6' opacity='.4'/>` +
    `<rect y='300' width='400' height='100' fill='#a47c55'/><rect y='300' width='400' height='8' fill='#b88f64'/><ellipse cx='200' cy='330' rx='58' ry='9' fill='#000' opacity='.14'/><path d='M146 308a54 34 0 0 0 108 0z' fill='#efe9dd'/>` +
    `<circle cx='180' cy='304' r='15' fill='#e8c85a'/><circle cx='214' cy='300' r='15' fill='#9db37a'/><circle cx='198' cy='290' r='15' fill='#e8c85a'/>`,
);

const BASKET = photo(
  `<rect width='400' height='400' fill='#e3dccf'/><rect y='312' width='400' height='88' fill='#cbb89c'/><path d='M96 224h208l-20 118H116z' fill='#b08b5a'/><path d='M104 252h192M110 282h180M114 312h172' stroke='#97763f' stroke-width='4'/>` +
    `<path d='M146 226c-14-52 38-76 58-52 20-30 76-10 66 52z' fill='#efe9dd'/><path d='M262 228c26 20 34 56 24 92h-38z' fill='#efe9dd'/><path d='M262 262l24-2M258 286l28-2' stroke='#a9715b' stroke-width='9'/><path d='M158 206l100-2' stroke='#a9715b' stroke-width='9'/><rect x='88' y='214' width='224' height='16' rx='8' fill='#c29e6a'/>`,
);

const VASE = photo(
  `<rect width='400' height='400' fill='#d7d9d3'/><rect y='322' width='400' height='78' fill='#bfa985'/><ellipse cx='200' cy='326' rx='64' ry='8' fill='#000' opacity='.12'/>` +
    `<path d='M192 206C170 150 150 112 138 74M200 206C200 150 206 100 206 52M208 206C230 150 256 118 272 82' stroke='#8a7a5a' stroke-width='3' fill='none'/>` +
    `<ellipse cx='138' cy='70' rx='13' ry='34' fill='#d9c7a1' transform='rotate(-14 138 70)'/><ellipse cx='206' cy='50' rx='14' ry='38' fill='#e4d5b2'/><ellipse cx='273' cy='78' rx='13' ry='34' fill='#d9c7a1' transform='rotate(16 273 78)'/><circle cx='168' cy='132' r='7' fill='#c4714b'/><circle cx='240' cy='120' r='7' fill='#c4714b'/>` +
    `<path d='M170 234c-30 28-32 62-12 92h84c20-30 18-64-12-92z' fill='#e8e2d6'/><rect x='182' y='198' width='36' height='42' rx='10' fill='#e8e2d6'/><path d='M170 262c20 8 40 8 60 0' stroke='#d3cbba' stroke-width='3' fill='none'/>`,
);

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6">
      <CustomerPhotoGrid
        title="Seen in your homes"
        description="Photos our customers shared with the tag #atnorth. Select one to see the original post."
        cta={{ label: "Share yours with #atnorth", href: "#" }}
        permission="Shared with permission"
        photos={[
          { id: "plant", photo: PLANT, alt: "A terracotta planter with a tall green plant on a wooden shelf", handle: "@maren.maakt", caption: "Sunday corner, finally finished", href: "#plant" },
          { id: "sofa", photo: SOFA, alt: "A grey-green sofa with a linen cushion, a sand cushion and a rust throw", handle: "@timvanderhoek", caption: "The linen cushions after one winter", href: "#sofa" },
          { id: "mugs", photo: MUGS, alt: "Two stoneware mugs of coffee on a linen tray, seen from above", handle: "@eefkesplaats", caption: "Slow mornings", href: "#mugs" },
          { id: "lamp", photo: LAMP, alt: "A black pendant lamp lighting a wooden table with a bowl of fruit", handle: "@joostenjo", caption: "Dinner lighting, sorted", href: "#lamp" },
          { id: "basket", photo: BASKET, alt: "A woven basket with a cream throw draped over its edge", handle: "@hetgroenehuis", caption: "Basket plus throw, ten out of ten", href: "#basket" },
          { id: "vase", photo: VASE, alt: "Dried pampas grass in a cream ceramic vase", handle: "@noor.at.home", caption: "Dried flowers, no watering", href: "#vase" },
        ]}
      />
    </div>
  );
}
