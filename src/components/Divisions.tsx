import { useMemo } from "react";
import { allPlayRecord, divisionStrength, formatRecord, winPct } from "../stats";
import type { Division, Team, Week } from "../types";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function Divisions({
  teams, weeks, divisions, me,
}: { teams: Team[]; weeks: Week[]; divisions: Division[]; me: number }) {
  const rows = useMemo(() => divisionStrength(teams, weeks, divisions), [teams, weeks, divisions]);
  const strongest = rows[0];
  const weakest = rows[rows.length - 1];

  return (
    <section>
      <h2>Division Strength</h2>
      <p className="muted">
        Ranked by how each division's teams score against every team in the other divisions, every week.
        Schedule luck doesn't count here.
      </p>
      <p>
        <strong>{strongest.division.name}</strong> is beast.{" "}
        <strong>{weakest.division.name}</strong> is weak.
      </p>
      <div className="stat-grid divisions">
        {rows.map((d, i) => {
          const mine = d.teams.some((t) => t.rosterId === me);
          return (
            <div key={d.division.id} className={`card division${mine ? " mine" : ""}`}>
              <div className="division-head">
                <span className="rank-badge">#{i + 1}</span>
                <h3>{d.division.name}</h3>
              </div>
              <dl className="division-stats">
                <dt>Vs. other divisions</dt>
                <dd>
                  <span className="stat-value">{pct(winPct(d.vsOtherDivisions))}</span>
                  <span className="muted small block">{formatRecord(d.vsOtherDivisions)} all-play</span>
                </dd>
                <dt>Real cross-division games</dt>
                <dd>{formatRecord(d.crossDivisionGames)}</dd>
                <dt>All-play vs. whole league</dt>
                <dd>{formatRecord(d.allPlay)} ({pct(winPct(d.allPlay))})</dd>
                <dt>Avg points per week</dt>
                <dd>{d.avgPoints.toFixed(1)}</dd>
                <dt>Weekly top-3 finishes</dt>
                <dd>{d.top3}</dd>
              </dl>
              <table className="division-teams">
                <thead>
                  <tr><th className="left">Team</th><th>All-play</th></tr>
                </thead>
                <tbody>
                  {d.teams
                    .map((t) => ({ t, rec: allPlayRecord(t.rosterId, weeks) }))
                    .sort((a, b) => winPct(b.rec) - winPct(a.rec))
                    .map(({ t, rec }) => (
                      <tr key={t.rosterId} className={t.rosterId === me ? "mine" : ""}>
                        <td className="left">{t.name}</td>
                        <td>{formatRecord(rec)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </section>
  );
}
