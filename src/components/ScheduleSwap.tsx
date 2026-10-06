import { useMemo } from "react";
import { scheduleSwap } from "../stats";
import type { Record3, Team, Week } from "../types";

const cls = (r: Record3) => (r.wins > r.losses ? "win" : r.wins < r.losses ? "loss" : "");

function SwapCard({
  x, schedules, data, me, showTies,
}: {
  x: Team;
  schedules: Team[];
  data: Record<number, Record3>;
  me: number;
  showTies: boolean;
}) {
  return (
    <div className={`card shakeup-card${x.rosterId === me ? " mine" : ""}`}>
      <table>
        <thead>
          <tr>
            <th className="left">
              {x.name}
              <span className="muted small block">with the schedule of</span>
            </th>
            <th>W</th>
            <th>L</th>
            {showTies && <th>T</th>}
          </tr>
        </thead>
        <tbody>
          {schedules.map((y) => {
            const r = data[y.rosterId];
            return (
              <tr key={y.rosterId} className={cls(r)}>
                <td className="left">{y.rosterId === x.rosterId ? `${y.name} (actual)` : y.name}</td>
                <td>{r.wins}</td>
                <td>{r.losses}</td>
                {showTies && <td>{r.ties}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ScheduleSwap({ teams, weeks, me }: { teams: Team[]; weeks: Week[]; me: number }) {
  const data = useMemo(() => scheduleSwap(teams, weeks), [teams, weeks]);
  const showTies = teams.some((x) => Object.values(data[x.rosterId]).some((r) => r.ties));
  const mineFirst = [...teams].sort((a, b) => (a.rosterId === me ? -1 : b.rosterId === me ? 1 : 0));

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Schedule Swap</h2>
          <p className="muted">
            If “X” had played “Y”'s schedule all season. The “actual” row is the real record.
          </p>
        </div>
      </div>
      <div className="shakeup-grid">
        {mineFirst.map((x) => (
          <SwapCard key={x.rosterId} x={x} schedules={teams} data={data[x.rosterId]} me={me} showTies={showTies} />
        ))}
      </div>
    </section>
  );
}
