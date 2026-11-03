import { IconBike, IconBook, IconBroom, IconGraduationCap, IconHanger, IconLaptop, IconPaintRoller, IconSofa, IconSprout, IconTree, IconTruck, IconWrench, IconZap } from "@rhs-ui/icons";
import { MarketplaceHero } from "@rhs-ui/marketing/marketplace-hero";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6">
      <p className="pt-6 text-xs text-muted-foreground">Six categories and the closing tile: seven tiles, so the last one takes a whole row.</p>
      <MarketplaceHero
        className="py-8 sm:py-10"
        title="Find something worth keeping."
        description="Pre-loved and handmade pieces from sellers across Europe, each one looked over by a person before it reaches you."
        browse={{ label: "Browse all listings", href: "#browse" }}
        sell={{ label: "Start selling", href: "#sell" }}
        trust="Every seller verified, every payment protected."
        categories={[
          { label: "Home & living", count: 12480, href: "#home", icon: <IconSofa /> },
          { label: "Fashion", count: 38214, href: "#fashion", icon: <IconHanger /> },
          { label: "Electronics", count: 9306, href: "#electronics", icon: <IconLaptop /> },
          { label: "Books & music", count: 21870, href: "#books", icon: <IconBook /> },
          { label: "Sports & outdoors", count: 7145, href: "#sports", icon: <IconBike /> },
          { label: "Garden", count: 5962, href: "#garden", icon: <IconSprout /> },
        ]}
        allCategories={{ href: "#categories", count: 94977 }}
      />

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">Seven categories and the closing tile: a two-by-four grid. The unit and the closing tile are your own words.</p>
      <MarketplaceHero
        className="py-8 sm:py-10"
        title="Hire someone good, nearby."
        description="Vetted local professionals, quotes within a day, and your payment held until the job is done."
        browse={{ label: "Find a pro", href: "#find" }}
        sell={{ label: "Offer your services", href: "#offer" }}
        trust="Background-checked pros, paid only when you are happy."
        labels={{ categories: "Browse services by category", listing: { one: "pro", other: "pros" } }}
        categories={[
          { label: "Plumbing", count: 412, href: "#plumbing", icon: <IconWrench /> },
          { label: "Electrical", count: 286, href: "#electrical", icon: <IconZap /> },
          { label: "Painting", count: 530, href: "#painting", icon: <IconPaintRoller /> },
          { label: "Cleaning", count: 944, href: "#cleaning", icon: <IconBroom /> },
          { label: "Gardening", count: 377, href: "#gardening", icon: <IconTree /> },
          { label: "Moving", count: 198, href: "#moving", icon: <IconTruck /> },
          { label: "Tutoring", count: 1206, href: "#tutoring", icon: <IconGraduationCap /> },
        ]}
        allCategories={{ label: "All services", href: "#services" }}
      />
    </div>
  );
}
