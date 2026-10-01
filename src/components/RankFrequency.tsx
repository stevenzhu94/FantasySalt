import { useMemo } from "react";
import { rankFrequency } from "../stats";
import type { Team, Week } from "../types";
import { heat } from "./heat";

export function RankFrequency({
  teams, weeks, me, ofOpponent = false,
}: { teams: Team[]; weeks: Week[]; me: number; ofOpponent?: boolean }) {
  const counts = useMemo(() => rankFrequency(teams, weeks, ofOpponent), [teams, weeks, ofOpponent]);
  const max = Math.max(1, ...Object.values(counts).flat());
  const ranks = teams.map((_, i) => i + 1);

  return (
    <section>
      <h2>Weekly {ofOpponent && <em>Opponent</em>} Ranking Frequency</h2>
      <p className="muted">
        {ofOpponent
          ? "How often the team you actually faced finished each place in weekly scoring."
          : "How often each team finished each place in weekly scoring."}
      </p>
      <div className="card scroll">
        <table className="matrix">
          <thead>
            <tr>
              <th className="left">Team</th>
              {ranks.map((r) => <th key={r}>{r}</th>)}
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.rosterId} className={t.rosterId === me ? "mine" : ""}>
                <th className="left">{t.name}</th>
                {counts[t.rosterId].map((c, i) => (
                  <td key={i} style={heat(c, 0, max)}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
