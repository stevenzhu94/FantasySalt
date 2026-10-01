import { useMemo } from "react";
import { shakeup } from "../stats";
import type { Team, Week } from "../types";

export function Shakeup({ teams, weeks, me }: { teams: Team[]; weeks: Week[]; me: number }) {
  const data = useMemo(() => shakeup(teams, weeks), [teams, weeks]);
  const anyTies = teams.some((x) => Object.values(data[x.rosterId]).some((r) => r.ties));
  const ordered = [...teams].sort((a, b) => (a.rosterId === me ? -1 : b.rosterId === me ? 1 : 0));

  return (
    <section>
      <h2>Salt Shakeup</h2>
      <p className="muted">If “X” played “Y” every week, all season.</p>
      <div className="shakeup-grid">
        {ordered.map((x) => (
          <div key={x.rosterId} className={`card shakeup-card${x.rosterId === me ? " mine" : ""}`}>
            <table>
              <thead>
                <tr>
                  <th className="left">
                    {x.name}
                    <span className="muted small block">versus</span>
                  </th>
                  <th>W</th>
                  <th>L</th>
                  {anyTies && <th>T</th>}
                </tr>
              </thead>
              <tbody>
                {teams.filter((y) => y.rosterId !== x.rosterId).map((y) => {
                  const r = data[x.rosterId][y.rosterId];
                  const cls = r.wins > r.losses ? "win" : r.wins < r.losses ? "loss" : "";
                  return (
                    <tr key={y.rosterId} className={cls}>
                      <td className="left">{y.name}</td>
                      <td>{r.wins}</td>
                      <td>{r.losses}</td>
                      {anyTies && <td>{r.ties}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </section>
  );
}
