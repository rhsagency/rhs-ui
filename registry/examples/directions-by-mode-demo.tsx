import { DirectionsByMode } from "@rhs-ui/marketing/directions-by-mode";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <DirectionsByMode
        eyebrow="Visit us"
        title="Getting here"
        description="Every route below starts at Utrecht Centraal, because that is where most visitors arrive. If you have not been before, allow ten minutes for the last stretch."
        address={["Halcyon Hall", "Kade 14", "3511 AB Utrecht"]}
        mapHref="https://example.com/maps/halcyon-hall"
        modes={[
          {
            kind: "train",
            title: "By train",
            body: [
              <>
                Get off at <strong>Utrecht Centraal</strong> and leave through the exit signed Jaarbeurs.
              </>,
              <>
                Cross the bus station and walk along <strong>Croeselaan</strong> for 300 metres, keeping the canal on your left.
              </>,
              <>
                The last 200 metres: turn right at the glass pavilion onto <strong>Kade</strong>. Halcyon Hall is the brick building with the green door, number 14.
              </>,
            ],
            facts: [
              { label: "From Amsterdam Centraal", value: "27 min" },
              { label: "Walk from the station", value: "6 min" },
            ],
            link: { label: "Live departures", href: "#departures" },
          },
          {
            kind: "bus",
            title: "By bus",
            body: (
              <>
                Take <strong>line 12</strong> or <strong>line 28</strong> from platform C of the bus station and get off at <strong>Kade</strong> after three stops. The stop is 50 metres from the entrance, on the same side of the road.
              </>
            ),
            facts: [
              { label: "From the station", value: "6 min" },
              { label: "Every", value: "7 min, Mon to Sat" },
            ],
          },
          {
            kind: "car",
            title: "By car",
            body: [
              <>
                Leave the A2 at exit <strong>8, Utrecht-Centrum</strong>, and follow the signs for <strong>P+R Kade</strong>.
              </>,
              "Park in the garage under Kade 10. Do not drive into the old town: the streets around it are closed to cars.",
              "Walk out of the garage by the blue stairwell. Halcyon Hall is straight across the street.",
            ],
            facts: [
              { label: "Parking", value: "2.40 euros an hour" },
              { label: "After 18:00", value: "6 euros flat" },
            ],
            link: { label: "Parking map", href: "#parking" },
          },
          {
            kind: "bike",
            title: "By bike",
            body: (
              <>
                Follow the cycle path along the canal and turn left at the <strong>Kade</strong> bridge. There are 120 free racks on the north side of the building and a covered rack beside the door.
              </>
            ),
            facts: [
              { label: "From Utrecht Centraal", value: "9 min" },
              { label: "Bike parking", value: "Free" },
            ],
          },
          {
            kind: "walk",
            title: "On foot",
            body: (
              <>
                From the station it is <strong>500 metres</strong>, about six minutes. The whole way is flat and paved, with a dropped kerb at every crossing. Follow the canal until you see the green door.
              </>
            ),
            facts: [{ label: "From Utrecht Centraal", value: "6 min" }],
          },
        ]}
        access={{
          title: "Step-free access",
          description: "Last checked on site in September 2026.",
          points: [
            { label: "Entrance", text: "Level entrance on Kade with automatic doors and no threshold." },
            { label: "Lift", text: "One lift serves every floor. It takes a wheelchair and one companion." },
            { label: "Accessible parking", text: "Four bays in the garage, level with the lift. Free with a blue badge." },
            { label: "Assistance dogs", text: "Welcome everywhere in the building. Water is available at reception." },
            { label: "Help on arrival", text: "Ring the bell at the side door and a host will meet you within two minutes." },
          ],
        }}
      />

      <div className="mt-24 border-t border-border pt-12">
        <p className="mb-10 text-xs text-muted-foreground">A place reached by water and air: no map link and no access panel, one level lower on the page</p>
        <DirectionsByMode
          headingLevel={3}
          title="Reaching the island"
          description="The museum is a ten-minute walk from the harbour."
          address={["Kestrel Island Museum", "Harbour Road 3", "Vlieland"]}
          modes={[
            {
              kind: "ferry",
              title: "By ferry",
              body: (
                <>
                  Sail from <strong>Harlingen</strong> to <strong>Vlieland harbour</strong>. Foot passengers leave by the gangway on the left and follow the signs for the village.
                </>
              ),
              facts: [
                { label: "Crossing", value: "1 h 45 min" },
                { label: "Last boat back", value: "19:10" },
              ],
            },
            {
              kind: "plane",
              title: "By air",
              body: "Small planes land on the island strip on weekends from May to September. A taxi meets every flight and takes you to the museum door in four minutes.",
              facts: [{ label: "From Rotterdam", value: "35 min" }],
            },
          ]}
        />
      </div>
    </div>
  );
}
