import { useMemo } from "react";
import { formatRecord, scheduleSwap, winPct } from "../stats";
import type { Team, Week } from "../types";
import { heat } from "./heat";

export function ScheduleSwap({ teams, weeks, me }: { teams: Team[]; weeks: Week[]; me: number }) {
  const data = useMemo(() => scheduleSwap(teams, weeks), [teams, weeks]);

  return (
    <section>
      <h2>Schedule Swap</h2>
      <p className="muted">
        Each row's record if that team had played the column team's schedule. The diagonal is the real record.
      </p>
      <div className="card scroll">
        <table className="matrix">
          <thead>
            <tr>
              <th className="left">Team ↓ / Schedule →</th>
              {teams.map((t) => <th key={t.rosterId}>{t.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {teams.map((x) => (
              <tr key={x.rosterId} className={x.rosterId === me ? "mine" : ""}>
                <th className="left">{x.name}</th>
                {teams.map((y) => {
                  const r = data[x.rosterId][y.rosterId];
                  return (
                    <td
                      key={y.rosterId}
                      style={heat(winPct(r), 0, 1)}
                      className={x.rosterId === y.rosterId ? "actual" : ""}
                    >
                      {formatRecord(r)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
