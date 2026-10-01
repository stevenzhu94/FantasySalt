import { useMemo, useState } from "react";
import { shakeup, sumRecords } from "../stats";
import type { Division, Record3, Team, Week } from "../types";
import { Matchup } from "./Matchup";

function ShakeupCard({
  x, opponents, data, me, showTies, total, onPick,
}: {
  x: Team;
  opponents: Team[];
  data: Record<number, Record3>;
  me: number;
  showTies: boolean;
  total?: boolean;
  onPick: (x: Team, y: Team) => void;
}) {
  const sum = sumRecords(opponents.map((y) => data[y.rosterId]));
  const cls = (r: Record3) => (r.wins > r.losses ? "win" : r.wins < r.losses ? "loss" : "");
  return (
    <div className={`card shakeup-card${x.rosterId === me ? " mine" : ""}`}>
      <table>
        <thead>
          <tr>
            <th className="left">
              {x.name}
              <span className="muted small block">versus</span>
            </th>
            <th>W</th>
            <th>L</th>
            {showTies && <th>T</th>}
          </tr>
        </thead>
        <tbody>
          {opponents.map((y) => {
            const r = data[y.rosterId];
            return (
              <tr
                key={y.rosterId}
                className={`pick ${cls(r)}`}
                tabIndex={0}
                role="button"
                aria-label={`${x.name} versus ${y.name}, week by week`}
                onClick={() => onPick(x, y)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPick(x, y);
                  }
                }}
              >
                <td className="left">{y.name}</td>
                <td>{r.wins}</td>
                <td>{r.losses}</td>
                {showTies && <td>{r.ties}</td>}
              </tr>
            );
          })}
          {total && (
            <tr className={`total ${cls(sum)}`}>
              <td className="left">Division total</td>
              <td>{sum.wins}</td>
              <td>{sum.losses}</td>
              {showTies && <td>{sum.ties}</td>}
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Shakeup({
  teams, weeks, divisions, me,
}: { teams: Team[]; weeks: Week[]; divisions: Division[]; me: number }) {
  const data = useMemo(() => shakeup(teams, weeks), [teams, weeks]);
  const [divisionOnly, setDivisionOnly] = useState(false);
  const [picked, setPicked] = useState<{ x: Team; y: Team } | null>(null);
  const pick = (x: Team, y: Team) => setPicked({ x, y });
  const showTies = teams.some((x) => Object.values(data[x.rosterId]).some((r) => r.ties));
  const mineFirst = (list: Team[]) =>
    [...list].sort((a, b) => (a.rosterId === me ? -1 : b.rosterId === me ? 1 : 0));
  const myDivision = teams.find((t) => t.rosterId === me)?.division;

  return (
    <section>
      <div className="section-head">
        <div>
          <h2>Salt Shakeup</h2>
          <p className="muted">
            If “X” played “Y” every week, all season{divisionOnly && ", division rivals only"}.
          </p>
        </div>
        {divisions.length > 0 && (
          <div className="segmented" role="group" aria-label="Opponents">
            <button className={divisionOnly ? "" : "active"} onClick={() => setDivisionOnly(false)}>
              All teams
            </button>
            <button className={divisionOnly ? "active" : ""} onClick={() => setDivisionOnly(true)}>
              Division only
            </button>
          </div>
        )}
      </div>

      {divisionOnly ? (
        [...divisions]
          .sort((a, b) => (a.id === myDivision ? -1 : b.id === myDivision ? 1 : 0))
          .map((d) => {
            const members = teams.filter((t) => t.division === d.id);
            return (
              <div key={d.id} className="division-group">
                <h3>{d.name}</h3>
                <div className="shakeup-grid">
                  {mineFirst(members).map((x) => (
                    <ShakeupCard
                      key={x.rosterId}
                      x={x}
                      opponents={members.filter((y) => y.rosterId !== x.rosterId)}
                      data={data[x.rosterId]}
                      me={me}
                      showTies={showTies}
                      onPick={pick}
                      total
                    />
                  ))}
                </div>
              </div>
            );
          })
      ) : (
        <div className="shakeup-grid">
          {mineFirst(teams).map((x) => (
            <ShakeupCard
              key={x.rosterId}
              x={x}
              opponents={teams.filter((y) => y.rosterId !== x.rosterId)}
              data={data[x.rosterId]}
              me={me}
              showTies={showTies}
              onPick={pick}
            />
          ))}
        </div>
      )}

      {picked && <Matchup x={picked.x} y={picked.y} weeks={weeks} onClose={() => setPicked(null)} />}
    </section>
  );
}
