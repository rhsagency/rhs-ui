import { Leaderboard } from "@rhs-ui/primitives/leaderboard";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-md p-8">
      <Leaderboard
        title="April step challenge"
        unit="steps"
        entries={[
          { id: "1", name: "Sara Haddad", detail: "Support", score: 318204, change: 1 },
          { id: "2", name: "Luca Romano", detail: "Engineering", score: 301877, change: -1 },
          { id: "3", name: "Anouk de Wit", detail: "Leadership", score: 284110, change: 2, you: true },
          { id: "4", name: "Mei Tanaka", detail: "Design", score: 266990 },
          { id: "5", name: "Daan Peters", detail: "Engineering", score: 240015, change: -2 },
        ]}
      />
    </div>
  );
}
