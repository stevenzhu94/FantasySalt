import { useMemo, useState } from "react";
import { summary, type SummaryRow } from "../stats";
import type { Team, Week } from "../types";

type Key = Exclude<keyof SummaryRow, "rosterId">;

const COLUMNS: { key: Key; label: string; digits?: number }[] = [
  { key: "avgRank", label: "Avg weekly rank", digits: 2 },
  { key: "avgOppRank", label: "Avg opponent rank", digits: 2 },
  { key: "top3", label: "Weeks in top 3" },
  { key: "bottom3", label: "Weeks in bottom 3" },
  { key: "oppBottom3", label: "Opponent in bottom 3" },
  { key: "oppTop3", label: "Opponent in top 3" },
  { key: "winsVsBottom3", label: "Wins vs bottom-3 opponents" },
  { key: "lossesToTop3", label: "Losses to top-3 opponents" },
];

export function Summary({ teams, weeks, me }: { teams: Team[]; weeks: Week[]; me: number }) {
  const rows = useMemo(() => summary(teams, weeks), [teams, weeks]);
  const [sort, setSort] = useState<{ key: Key; desc: boolean }>({ key: "avgRank", desc: false });
  const names = new Map(teams.map((t) => [t.rosterId, t.name]));
  const sorted = [...rows].sort((a, b) => (sort.desc ? b[sort.key] - a[sort.key] : a[sort.key] - b[sort.key]));

  return (
    <section>
      <h2>Rank Breakdown</h2>
      <p className="muted">
        All ranks are relative, week by week (1 = top scorer that week), not overall standings. Click a column to sort.
      </p>
      <div className="card scroll">
        <table className="matrix summary">
          <thead>
            <tr>
              <th className="left">Team</th>
              {COLUMNS.map((c) => (
                <th key={c.key}>
                  <button
                    className="sort"
                    onClick={() => setSort((s) => ({ key: c.key, desc: s.key === c.key ? !s.desc : false }))}
                  >
                    {c.label}
                    {sort.key === c.key && (sort.desc ? " ▼" : " ▲")}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.rosterId} className={r.rosterId === me ? "mine" : ""}>
                <th className="left">{names.get(r.rosterId)}</th>
                {COLUMNS.map((c) => <td key={c.key}>{r[c.key].toFixed(c.digits ?? 0)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
