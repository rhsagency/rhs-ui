import { CookieDeclaration } from "@rhs-ui/marketing/cookie-declaration";
import { Button } from "@rhs-ui/primitives/button";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <CookieDeclaration
        title="Cookie declaration"
        caption="The cookies and similar storage used on northwind.example. We check this list every quarter, and our banner links here."
        updated="2026-10-04"
        locale="en-GB"
        consent={
          <>
            <div>
              <p className="text-xs text-muted-foreground">Your consent ID</p>
              <p className="mt-1 text-sm font-medium tabular-nums select-all">7F3A-92C1-D04E</p>
            </div>
            <Button variant="outline">Change my choice</Button>
          </>
        }
        categories={[
          {
            title: "Necessary",
            description: "The site cannot work without these. They keep you signed in and remember your choices, and they do not track you.",
            required: true,
            cookies: [
              { name: "nw_session", provider: "Northwind", purpose: "Keeps you signed in as you move between pages.", duration: "Session", type: "HTTP" },
              { name: "nw_csrf", provider: "Northwind", purpose: "Protects forms against requests sent from other sites.", duration: "Session", type: "HTTP" },
              { name: "nw_consent", provider: "Northwind", purpose: "Remembers the choices you made in the cookie banner.", duration: "1 year", type: "HTTP" },
            ],
          },
          {
            title: "Preferences",
            description: "Remember your settings, so the site looks the way you left it.",
            cookies: [
              { name: "nw_locale", provider: "Northwind", purpose: "Remembers your language and region.", duration: "1 year", type: "HTTP" },
              { name: "nw_theme", provider: "Northwind", purpose: "Remembers whether you chose the light or dark theme.", duration: "Until cleared", type: "Local storage" },
            ],
          },
          {
            title: "Analytics",
            description: "Show us which pages are used, without identifying you.",
            cookies: [
              { name: "_hly_id", provider: "Halcyon Analytics", purpose: "A random id, so repeat visits are counted once.", duration: "13 months", type: "HTTP" },
              { name: "hly_beacon", provider: "Halcyon Analytics", purpose: "Counts a page view when scripts are blocked.", duration: "Session", type: "Pixel" },
            ],
          },
          {
            title: "Marketing",
            description: "Used to show our ads on other sites. We do not use any.",
            cookies: [],
          },
        ]}
      />
    </div>
  );
}
